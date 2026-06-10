import {
  BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post,
} from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyEventDto, ReminderDto, ShoppingItemDto } from './dto/family-life.dto';

@Controller('family-life')
export class FamilyLifeController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}

  @Get('overview')
  async overview(@CurrentUser() user: AuthenticatedUser) {
    const householdId = await this.context.getHouseholdId(user.id);
    const [reminders, shopping, events] = await Promise.all([
      this.prisma.reminder.findMany({
        where: { householdId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { dueAt: 'asc' }, take: 5,
      }),
      this.prisma.shoppingItem.findMany({
        where: { householdId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: [{ priority: 'desc' }, { neededBy: 'asc' }], take: 5,
      }),
      this.prisma.familyEvent.findMany({
        where: { householdId, startsAt: { gte: new Date() }, status: { not: 'CANCELLED' } },
        orderBy: { startsAt: 'asc' }, take: 5,
      }),
    ]);
    return { reminders, shopping, events };
  }

  @Get('reminders')
  async reminders(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.reminder.findMany({
      where: { householdId: await this.context.getHouseholdId(user.id) },
      include: { assignee: { select: { id: true, name: true } } },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
    });
  }
  @Post('reminders')
  async createReminder(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReminderDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.checkAssignee(householdId, dto.assigneeId);
    return this.prisma.reminder.create({ data: { ...dto, householdId } });
  }
  @Patch('reminders/:id')
  async updateReminder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReminderDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.ensure('reminder', id, householdId); await this.checkAssignee(householdId, dto.assigneeId);
    return this.prisma.reminder.update({ where: { id }, data: dto });
  }
  @Delete('reminders/:id')
  async deleteReminder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prisma.reminder.deleteMany({ where: { id, householdId: await this.context.getHouseholdId(user.id) } });
  }

  @Get('shopping')
  async shopping(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.shoppingItem.findMany({
      where: { householdId: await this.context.getHouseholdId(user.id) },
      include: { assignee: { select: { id: true, name: true } } },
      orderBy: [{ status: 'asc' }, { neededBy: 'asc' }],
    });
  }
  @Post('shopping')
  async createShopping(@CurrentUser() user: AuthenticatedUser, @Body() dto: ShoppingItemDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.checkAssignee(householdId, dto.assigneeId);
    return this.prisma.shoppingItem.create({ data: { ...dto, householdId } });
  }
  @Patch('shopping/:id')
  async updateShopping(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ShoppingItemDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.ensure('shoppingItem', id, householdId); await this.checkAssignee(householdId, dto.assigneeId);
    return this.prisma.shoppingItem.update({ where: { id }, data: dto });
  }
  @Delete('shopping/:id')
  async deleteShopping(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prisma.shoppingItem.deleteMany({ where: { id, householdId: await this.context.getHouseholdId(user.id) } });
  }

  @Get('events')
  async events(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.familyEvent.findMany({
      where: { householdId: await this.context.getHouseholdId(user.id) },
      orderBy: [{ status: 'asc' }, { startsAt: 'asc' }],
    });
  }
  @Post('events')
  async createEvent(@CurrentUser() user: AuthenticatedUser, @Body() dto: FamilyEventDto) {
    return this.prisma.familyEvent.create({
      data: { ...dto, householdId: await this.context.getHouseholdId(user.id) },
    });
  }
  @Patch('events/:id')
  async updateEvent(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: FamilyEventDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    await this.ensure('familyEvent', id, householdId);
    return this.prisma.familyEvent.update({ where: { id }, data: dto });
  }
  @Delete('events/:id')
  async deleteEvent(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prisma.familyEvent.deleteMany({ where: { id, householdId: await this.context.getHouseholdId(user.id) } });
  }

  private async checkAssignee(householdId: string, assigneeId?: string) {
    if (assigneeId && !await this.prisma.householdMember.findFirst({ where: { householdId, userId: assigneeId } }))
      throw new BadRequestException('Responsável inválido.');
  }
  private async ensure(model: 'reminder' | 'shoppingItem' | 'familyEvent', id: string, householdId: string) {
    const found = await (this.prisma[model] as any).findFirst({ where: { id, householdId } });
    if (!found) throw new BadRequestException('Item não encontrado.');
  }
}
