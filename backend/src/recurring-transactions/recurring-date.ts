export function monthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export function monthEnd(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1));
}

export function recurringDate(month: Date, dayOfMonth: number) {
  const normalized = monthStart(month);
  const lastDay = new Date(Date.UTC(
    normalized.getUTCFullYear(), normalized.getUTCMonth() + 1, 0,
  )).getUTCDate();
  return new Date(Date.UTC(
    normalized.getUTCFullYear(), normalized.getUTCMonth(), Math.min(dayOfMonth, lastDay), 12,
  ));
}
