import { Controller, Get } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const householdId = await this.context.getHouseholdId(user.id);
    return this.prisma.user.findMany({
      where: { memberships: { some: { householdId } } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }
}
