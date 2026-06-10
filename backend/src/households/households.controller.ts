import { Controller, Get } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { HouseholdContextService } from '../common/household.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('households')
export class HouseholdsController {
  constructor(private readonly prisma: PrismaService, private readonly context: HouseholdContextService) {}
  @Get('current')
  async current(@CurrentUser() user: AuthenticatedUser) {
    const id = await this.context.getHouseholdId(user.id);
    return this.prisma.household.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
  }
}
