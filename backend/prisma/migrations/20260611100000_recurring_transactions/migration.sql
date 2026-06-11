CREATE TABLE "RecurringTransaction" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "responsibleId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "startMonth" TIMESTAMP(3) NOT NULL,
    "endMonth" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction"
ADD COLUMN "recurringTransactionId" UUID,
ADD COLUMN "recurringMonth" TIMESTAMP(3);

CREATE INDEX "RecurringTransaction_householdId_active_idx" ON "RecurringTransaction"("householdId", "active");
CREATE INDEX "RecurringTransaction_categoryId_idx" ON "RecurringTransaction"("categoryId");
CREATE UNIQUE INDEX "Transaction_recurringTransactionId_recurringMonth_key"
ON "Transaction"("recurringTransactionId", "recurringMonth");

ALTER TABLE "RecurringTransaction"
ADD CONSTRAINT "RecurringTransaction_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringTransaction"
ADD CONSTRAINT "RecurringTransaction_responsibleId_fkey"
FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RecurringTransaction"
ADD CONSTRAINT "RecurringTransaction_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_recurringTransactionId_fkey"
FOREIGN KEY ("recurringTransactionId") REFERENCES "RecurringTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RecurringTransaction" ENABLE ROW LEVEL SECURITY;
