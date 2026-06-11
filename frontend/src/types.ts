export type Category = { id: string; name: string; type: string; nature?: string; color: string };
export type Member = { id: string; name: string; email: string };
export type Transaction = {
  id: string; date: string; type: string; categoryId: string; category: Category;
  subcategory?: string; description: string; amount: string; responsibleId: string;
  responsible: Member; paymentMethod: string; nature: string; notes?: string;
  recurringTransactionId?: string;
};
export type Report = {
  income: number; expenses: number; balance: number; overallBalance: number; saved: number;
  totalSaved: number; emergencies: number; spentPercentage: number;
  topCategories: { name: string; color: string; amount: number }[]; alerts: string[];
};
