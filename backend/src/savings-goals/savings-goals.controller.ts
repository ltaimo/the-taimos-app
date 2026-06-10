import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { SavingsGoalDto, SavingsMovementDto } from './dto/savings.dto';

@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const householdId = await this.context.getHouseholdId(user.id);
    const goals = await this.prisma.savingsGoal.findMany({
      where: { householdId }, include: { movements: { orderBy: { date: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return goals.map((goal) => {
      const current = goal.movements.reduce((sum, movement) =>
        sum + Number(movement.amount) * (movement.type === 'CONTRIBUTION' ? 1 : -1), 0);
      return { ...goal, currentAmount: current, progress: Math.min(100, current / Number(goal.targetAmount) * 100) };
    });
  }
  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: SavingsGoalDto) {
    return this.prisma.savingsGoal.create({
      data: { ...dto, householdId: await this.context.getHouseholdId(user.id) },
    });
  }
  @Patch(':id')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SavingsGoalDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.ensureGoal(id, householdId);
    return this.prisma.savingsGoal.update({ where: { id }, data: dto });
  }
  @Post(':id/movements')
  async addMovement(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SavingsMovementDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    const goal = await this.ensureGoal(id, householdId);
    if (dto.type === 'WITHDRAWAL') {
      const movements = await this.prisma.savingsMovement.findMany({ where: { goalId: id } });
      const current = movements.reduce((sum, x) => sum + Number(x.amount) * (x.type === 'CONTRIBUTION' ? 1 : -1), 0);
      if (dto.amount > current) throw new BadRequestException('A retirada excede o valor disponível.');
    }
    return this.prisma.savingsMovement.create({ data: { ...dto, goalId: goal.id } });
  }
  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prisma.savingsGoal.deleteMany({ where: { id, householdId: await this.context.getHouseholdId(user.id) } });
  }
  private async ensureGoal(id: string, householdId: string) {
    const goal = await this.prisma.savingsGoal.findFirst({ where: { id, householdId } });
    if (!goal) throw new BadRequestException('Objetivo não encontrado.');
    return goal;
  }
}
