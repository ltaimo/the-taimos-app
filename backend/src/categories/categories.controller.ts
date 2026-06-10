import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const householdId = await this.context.getHouseholdId(user.id);
    return this.prisma.category.findMany({ where: { householdId }, orderBy: [{ type: 'asc' }, { name: 'asc' }] });
  }
  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CategoryDto) {
    const householdId = await this.context.getHouseholdId(user.id);
    return this.prisma.category.create({ data: { ...dto, householdId } });
  }
  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const householdId = await this.context.getHouseholdId(user.id);
    return this.prisma.category.deleteMany({ where: { id, householdId, isDefault: false } });
  }
}
