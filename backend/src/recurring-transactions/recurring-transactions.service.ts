import { BadRequestException, Injectable } from '@nestjs/common';
import { RecurringTransaction, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecurringTransactionDto } from './dto/recurring-transaction.dto';
import { monthEnd, monthStart, recurringDate } from './recurring-date';

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  monthStart(value: Date) {
    return monthStart(value);
  }

  monthEnd(value: Date) {
    return monthEnd(value);
  }

  async validateRelations(householdId: string, dto: RecurringTransactionDto) {
    if (dto.type === TransactionType.SAVING) {
      throw new BadRequestException('Os registos fixos devem ser entradas ou saídas.');
    }
    const [category, member] = await Promise.all([
      this.prisma.category.findFirst({ where: { id: dto.categoryId, householdId } }),
      this.prisma.householdMember.findFirst({ where: { userId: dto.responsibleId, householdId } }),
    ]);
    if (!category || !member) throw new BadRequestException('Categoria ou responsável inválido.');
    if (category.type !== dto.type) throw new BadRequestException('A categoria não corresponde ao tipo do registo.');
    const startMonth = this.monthStart(dto.startMonth);
    const endMonth = dto.endMonth ? this.monthStart(dto.endMonth) : undefined;
    if (endMonth && endMonth < startMonth) {
      throw new BadRequestException('O mês final não pode ser anterior ao mês inicial.');
    }
    return { startMonth, endMonth };
  }

  async ensureMonth(householdId: string, month: Date) {
    const recurringMonth = this.monthStart(month);
    const templates = await this.prisma.recurringTransaction.findMany({
      where: {
        householdId,
        active: true,
        startMonth: { lte: recurringMonth },
        OR: [{ endMonth: null }, { endMonth: { gte: recurringMonth } }],
      },
    });
    await Promise.all(templates.map((template) => this.materialize(template, recurringMonth)));
  }

  async ensureThroughMonth(householdId: string, target: Date) {
    const targetMonth = this.monthStart(target);
    const templates = await this.prisma.recurringTransaction.findMany({
      where: { householdId, active: true, startMonth: { lte: targetMonth } },
    });
    const jobs: Promise<unknown>[] = [];
    for (const template of templates) {
      const lastMonth = template.endMonth && template.endMonth < targetMonth ? template.endMonth : targetMonth;
      for (
        let month = this.monthStart(template.startMonth);
        month <= lastMonth;
        month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))
      ) {
        jobs.push(this.materialize(template, month));
      }
    }
    await Promise.all(jobs);
  }

  async syncCurrentMonth(template: RecurringTransaction) {
    const currentMonth = this.monthStart(new Date());
    if (template.active && template.startMonth <= currentMonth && (!template.endMonth || template.endMonth >= currentMonth)) {
      await this.materialize(template, currentMonth);
    }
  }

  async removeFutureGenerated(templateId: string, from = this.monthStart(new Date())) {
    await this.prisma.transaction.deleteMany({
      where: { recurringTransactionId: templateId, recurringMonth: { gte: from } },
    });
  }

  private async materialize(template: RecurringTransaction, recurringMonth: Date) {
    const date = recurringDate(recurringMonth, template.dayOfMonth);
    return this.prisma.transaction.upsert({
      where: {
        recurringTransactionId_recurringMonth: {
          recurringTransactionId: template.id,
          recurringMonth,
        },
      },
      update: {
        responsibleId: template.responsibleId,
        categoryId: template.categoryId,
        date,
        type: template.type,
        description: template.name,
        amount: template.amount,
        paymentMethod: template.paymentMethod,
        nature: 'FIXED',
        notes: template.notes,
      },
      create: {
        householdId: template.householdId,
        responsibleId: template.responsibleId,
        categoryId: template.categoryId,
        date,
        type: template.type,
        description: template.name,
        amount: template.amount,
        paymentMethod: template.paymentMethod,
        nature: 'FIXED',
        notes: template.notes,
        recurringTransactionId: template.id,
        recurringMonth,
      },
    });
  }
}
