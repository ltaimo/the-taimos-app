import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '../categories/default-categories';
import { BootstrapDto } from './dto/bootstrap.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(id: string, email: string, dto: BootstrapDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { memberships: { include: { household: true } } },
    });
    if (existing?.memberships[0]) {
      return this.prisma.user.update({
        where: { id },
        data: { email, name: dto.name },
        include: { memberships: { include: { household: true } } },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { id },
        update: { email, name: dto.name },
        create: { id, email, name: dto.name },
      });

      let household;
      if (dto.inviteCode) {
        household = await tx.household.findUnique({ where: { inviteCode: dto.inviteCode.toUpperCase() } });
        if (!household) throw new BadRequestException('Código de convite inválido.');
      } else {
        if (!dto.householdName) throw new BadRequestException('Indique o nome da família.');
        household = await tx.household.create({
          data: {
            name: dto.householdName,
            inviteCode: crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase(),
            categories: {
              create: DEFAULT_CATEGORIES.map((category, index) => ({
                ...category, color: ['#0f766e', '#2563eb', '#7c3aed', '#ea580c', '#dc2626'][index % 5],
                isDefault: true,
              })),
            },
          },
        });
      }
      await tx.householdMember.create({
        data: { userId: user.id, householdId: household.id, role: dto.inviteCode ? 'MEMBER' : 'OWNER' },
      });
      return tx.user.findUnique({
        where: { id },
        include: { memberships: { include: { household: true } } },
      });
    });
  }
}
