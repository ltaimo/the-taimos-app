import {
  BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { PaymentMethod, Prisma, TransactionType } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionDto } from './dto/transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month?: string,
    @Query('type') type?: TransactionType,
    @Query('categoryId') categoryId?: string,
    @Query('responsibleId') responsibleId?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
  ) {
    const householdId = await this.context.getHouseholdId(user.id);
    const where: Prisma.TransactionWhereInput = { householdId };
    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      where.date = { gte: start, lt: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)) };
    }
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (responsibleId) where.responsibleId = responsibleId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    return this.prisma.transaction.findMany({
      where,
      include: { category: true, responsible: { select: { id: true, name: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: TransactionDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.validateRelations(householdId, dto);
    return this.prisma.transaction.create({ data: { ...dto, householdId } });
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: TransactionDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.validateRelations(householdId, dto);
    const found = await this.prisma.transaction.findFirst({ where: { id, householdId } });
    if (!found) throw new BadRequestException('Movimento não encontrado.');
    return this.prisma.transaction.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const householdId = await this.context.getHouseholdId(user.id);
    return this.prisma.transaction.deleteMany({ where: { id, householdId } });
  }

  private async validateRelations(householdId: string, dto: TransactionDto) {
    const [category, member] = await Promise.all([
      this.prisma.category.findFirst({ where: { id: dto.categoryId, householdId } }),
      this.prisma.householdMember.findFirst({ where: { userId: dto.responsibleId, householdId } }),
    ]);
    if (!category || !member) throw new BadRequestException('Categoria ou responsável inválido.');
  }
}
