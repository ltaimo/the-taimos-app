import { TransactionNature, TransactionType } from '@prisma/client';

export const DEFAULT_CATEGORIES = [
  ...['Salário', 'Negócio', 'Bónus', 'Apoio familiar', 'Outros'].map((name) => ({
    name, type: TransactionType.INCOME, nature: null,
  })),
  ...['Renda/Casa', 'Energia', 'Água', 'Internet', 'Escola', 'Transporte fixo', 'Empregada', 'Dívidas', 'Outros'].map((name) => ({
    name, type: TransactionType.EXPENSE, nature: TransactionNature.FIXED,
  })),
  ...['Alimentação', 'Transporte', 'Saúde', 'Farmácia', 'Crianças', 'Mercado', 'Lazer', 'Igreja', 'Família', 'Presentes', 'Manutenção da casa', 'Manutenção do carro', 'Outros'].map((name) => ({
    name, type: TransactionType.EXPENSE, nature: TransactionNature.VARIABLE,
  })),
  ...['Saúde urgente', 'Funeral', 'Reparação inesperada', 'Apoio familiar urgente', 'Outros'].map((name) => ({
    name, type: TransactionType.EXPENSE, nature: TransactionNature.EMERGENCY,
  })),
  ...['Fundo de emergência', 'Poupança geral', 'Objetivo da família', 'Investimento'].map((name) => ({
    name, type: TransactionType.SAVING, nature: TransactionNature.SAVING,
  })),
];
