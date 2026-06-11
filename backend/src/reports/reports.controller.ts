import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecurringTransactionsService } from '../recurring-transactions/recurring-transactions.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: HouseholdContextService,
    private readonly recurring: RecurringTransactionsService,
  ) {}

  @Get('monthly')
  async monthly(@CurrentUser() user: AuthenticatedUser, @Query('month') month?: string) {
    const householdId = await this.context.getHouseholdId(user.id);
    const selected = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
    const start = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1));
    const end = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() + 1, 1));
    await this.recurring.ensureThroughMonth(householdId, start);
    const [transactions, budgets, goals, allTransactions] = await Promise.all([
      this.prisma.transaction.findMany({ where: { householdId, date: { gte: start, lt: end } }, include: { category: true } }),
      this.prisma.monthlyBudget.findMany({ where: { householdId, month: { gte: start, lt: end } }, include: { category: true } }),
      this.prisma.savingsGoal.findMany({ where: { householdId }, include: { movements: true } }),
      this.prisma.transaction.findMany({ where: { householdId }, select: { type: true, amount: true } }),
    ]);
    const sum = (type: string, nature?: string) => transactions
      .filter((x) => x.type === type && (!nature || x.nature === nature))
      .reduce((total, x) => total + Number(x.amount), 0);
    const income = sum('INCOME');
    const expenses = sum('EXPENSE');
    const goalMovements = goals.flatMap((goal) => goal.movements);
    const monthlyGoalSavings = goalMovements
      .filter((movement) => movement.date >= start && movement.date < end)
      .reduce((total, movement) =>
        total + Number(movement.amount) * (movement.type === 'CONTRIBUTION' ? 1 : -1), 0);
    const saved = sum('SAVING') + monthlyGoalSavings;
    const emergencies = sum('EXPENSE', 'EMERGENCY');
    const categories = new Map<string, { name: string; color: string; amount: number }>();
    for (const item of transactions.filter((x) => x.type === 'EXPENSE')) {
      const current = categories.get(item.categoryId) ?? { name: item.category.name, color: item.category.color, amount: 0 };
      current.amount += Number(item.amount);
      categories.set(item.categoryId, current);
    }
    const topCategories = [...categories.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const alerts = budgets.flatMap((budget) => {
      const spent = categories.get(budget.categoryId)?.amount ?? 0;
      return spent > Number(budget.amount)
        ? [`Este mês os gastos com ${budget.category.name.toLowerCase()} ultrapassaram o orçamento.`] : [];
    });
    if (income > 0 && emergencies > 0) alerts.push(`As emergências consumiram ${(emergencies / income * 100).toFixed(1)}% da renda mensal.`);
    if (income > 0 && saved / income < 0.1) alerts.push('A poupança ficou abaixo da meta recomendada de 10% do rendimento.');
    const overallIncome = allTransactions.filter((x) => x.type === 'INCOME').reduce((s, x) => s + Number(x.amount), 0);
    const overallOut = allTransactions.filter((x) => x.type === 'EXPENSE').reduce((s, x) => s + Number(x.amount), 0);
    const overallSaving = allTransactions.filter((x) => x.type === 'SAVING').reduce((s, x) => s + Number(x.amount), 0);
    const goalsBalance = goalMovements.reduce((total, movement) =>
      total + Number(movement.amount) * (movement.type === 'CONTRIBUTION' ? 1 : -1), 0);
    const totalSaved = overallSaving + goalsBalance;
    return {
      month: start, income, expenses, balance: income - expenses - saved,
      overallBalance: overallIncome - overallOut - totalSaved, saved, totalSaved, emergencies,
      spentPercentage: income > 0 ? expenses / income * 100 : 0,
      topCategories, alerts,
    };
  }
}
