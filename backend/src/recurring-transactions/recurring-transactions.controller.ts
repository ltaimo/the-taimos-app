import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecurringTransactionDto } from './dto/recurring-transaction.dto';
import { RecurringTransactionsService } from './recurring-transactions.service';

@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: HouseholdContextService,
    private readonly recurring: RecurringTransactionsService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query('month') month?: string) {
    const householdId = await this.context.getHouseholdId(user.id);
    const selected = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
    const monthStart = this.recurring.monthStart(selected);
    await this.recurring.ensureMonth(householdId, monthStart);
    const items = await this.prisma.recurringTransaction.findMany({
      where: { householdId },
      include: {
        category: true,
        responsible: { select: { id: true, name: true } },
        transactions: { where: { recurringMonth: monthStart }, select: { id: true, date: true } },
      },
      orderBy: [{ active: 'desc' }, { type: 'asc' }, { dayOfMonth: 'asc' }],
    });
    const active = items.filter((item) =>
      item.active && item.startMonth <= monthStart && (!item.endMonth || item.endMonth >= monthStart));
    const total = (type: string) => active.filter((item) => item.type === type)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { items, summary: { income: total('INCOME'), expenses: total('EXPENSE'), balance: total('INCOME') - total('EXPENSE') } };
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: RecurringTransactionDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    const dates = await this.recurring.validateRelations(householdId, dto);
    const template = await this.prisma.recurringTransaction.create({
      data: { ...dto, ...dates, endMonth: dates.endMonth ?? null, active: dto.active ?? true, householdId },
    });
    await this.recurring.syncCurrentMonth(template);
    return template;
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RecurringTransactionDto,
  ) {
    const householdId = await this.context.getHouseholdId(user.id);
    if (!await this.prisma.recurringTransaction.findFirst({ where: { id, householdId } })) {
      throw new BadRequestException('Registo fixo não encontrado.');
    }
    const dates = await this.recurring.validateRelations(householdId, dto);
    const template = await this.prisma.recurringTransaction.update({
      where: { id },
      data: { ...dto, ...dates, endMonth: dates.endMonth ?? null },
    });
    await this.recurring.removeFutureGenerated(id);
    await this.recurring.syncCurrentMonth(template);
    return template;
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const householdId = await this.context.getHouseholdId(user.id);
    const template = await this.prisma.recurringTransaction.findFirst({ where: { id, householdId } });
    if (!template) throw new BadRequestException('Registo fixo não encontrado.');
    await this.recurring.removeFutureGenerated(id);
    return this.prisma.recurringTransaction.delete({ where: { id } });
  }
}
