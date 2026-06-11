import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetDto } from './dto/budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query('month') month?: string) {
    const householdId = await this.context.getHouseholdId(user.id);
    const date = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    const budgets = await this.prisma.monthlyBudget.findMany({
      where: { householdId, month: { gte: start, lt: end } }, include: { category: true },
    });
    const spent = await this.prisma.transaction.groupBy({
      by: ['categoryId'], where: { householdId, type: 'EXPENSE', date: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    return budgets.map((budget) => {
      const used = Number(spent.find((x) => x.categoryId === budget.categoryId)?._sum.amount ?? 0);
      const amount = Number(budget.amount);
      const ratio = used / amount;
      return { ...budget, spent: used, difference: amount - used, status: ratio > 1 ? 'OVER' : ratio >= 0.8 ? 'WARNING' : 'OK' };
    });
  }
  @Post()
  async upsert(@CurrentUser() user: AuthenticatedUser, @Body() dto: BudgetDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    if (!await this.prisma.category.findFirst({
      where: { id: dto.categoryId, householdId, type: 'EXPENSE' },
    }))
      throw new BadRequestException('Categoria inválida.');
    const month = new Date(Date.UTC(dto.month.getUTCFullYear(), dto.month.getUTCMonth(), 1));
    return this.prisma.monthlyBudget.upsert({
      where: { householdId_categoryId_month: { householdId, categoryId: dto.categoryId, month } },
      update: { amount: dto.amount }, create: { ...dto, month, householdId },
    });
  }
  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prisma.monthlyBudget.deleteMany({ where: { id, householdId: await this.context.getHouseholdId(user.id) } });
  }
}
