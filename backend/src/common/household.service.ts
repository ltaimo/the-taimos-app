import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HouseholdContextService {
  constructor(private readonly prisma: PrismaService) {}
  async getHouseholdId(userId: string) {
    const member = await this.prisma.householdMember.findFirst({
      where: { userId },
      select: { householdId: true },
    });
    if (!member) throw new ForbiddenException('O utilizador ainda não pertence a uma família.');
    return member.householdId;
  }
}
