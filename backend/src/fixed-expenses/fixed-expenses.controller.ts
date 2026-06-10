import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { FixedExpenseDto } from './dto/fixed-expense.dto';

@Controller('fixed-expenses')
export class FixedExpensesController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query('month') month?: string) {
    const householdId = await this.context.getHouseholdId(user.id);
    const date = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    const items = await this.prisma.fixedExpense.findMany({
      where: { householdId, month: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { dueDay: 'asc' },
    });
    const total = (status?: string) => items.filter((x) => !status || x.status === status)
      .reduce((sum, x) => sum + Number(x.expectedAmount), 0);
    return { items, summary: { expected: total(), paid: total('PAID'), pending: total('PENDING'), overdue: total('OVERDUE') } };
  }
  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: FixedExpenseDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.checkCategory(householdId, dto.categoryId);
    return this.prisma.fixedExpense.create({ data: { ...dto, householdId } });
  }
  @Patch(':id')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: FixedExpenseDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.checkCategory(householdId, dto.categoryId);
    const item = await this.prisma.fixedExpense.findFirst({ where: { id, householdId } });
    if (!item) throw new BadRequestException('Despesa não encontrada.');
    return this.prisma.fixedExpense.update({ where: { id }, data: dto });
  }
  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prisma.fixedExpense.deleteMany({
      where: { id, householdId: await this.context.getHouseholdId(user.id) },
    });
  }
  private async checkCategory(householdId: string, categoryId: string) {
    if (!await this.prisma.category.findFirst({ where: { id: categoryId, householdId } }))
      throw new BadRequestException('Categoria inválida.');
  }
}
