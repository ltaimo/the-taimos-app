import { PrismaClient } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../src/categories/default-categories';

const prisma = new PrismaClient();
async function main() {
  const households = await prisma.household.findMany({ select: { id: true } });
  for (const household of households) {
    for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
      const existing = await prisma.category.findFirst({
        where: {
          householdId: household.id, name: category.name,
          type: category.type, nature: category.nature,
        },
      });
      if (!existing) {
        await prisma.category.create({ data: {
          ...category, householdId: household.id, isDefault: true,
          color: ['#0f766e', '#2563eb', '#7c3aed', '#ea580c', '#dc2626'][index % 5],
        } });
      }
    }
  }
  console.log(`Categorias verificadas para ${households.length} família(s).`);
}
main().finally(() => prisma.$disconnect());
