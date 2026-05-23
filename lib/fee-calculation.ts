export type CoveredMonth = { month: number; year: number };
export type CoveredBillingCycle = CoveredMonth & { dueDate: Date };

export function toDateOnly(value: Date | string) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function addMonthsClamped(date: Date, months: number) {
  const nextMonth = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(date.getFullYear(), nextMonth + 1, 0).getDate();
  return new Date(
    date.getFullYear(),
    nextMonth,
    Math.min(date.getDate(), lastDayOfTargetMonth)
  );
}

export function getPaidTillDateForMonths(startDate: Date, monthCount: number) {
  return addDays(addMonthsClamped(toDateOnly(startDate), monthCount), -1);
}

export function getDefaultFeePaidTillDate(joiningDate: Date, isInitialFeePaid: boolean) {
  const joining = toDateOnly(joiningDate);
  return isInitialFeePaid ? getPaidTillDateForMonths(joining, 1) : addDays(joining, -1);
}

export function getNextDueDate(paidTillDate: Date) {
  return addDays(toDateOnly(paidTillDate), 1);
}

export function getCoveredBillingMonths(startDate: Date, paidTillDate: Date) {
  return getCoveredBillingCycles(startDate, paidTillDate).map(({ month, year }) => ({
    month,
    year,
  }));
}

export function getCoveredBillingCycles(startDate: Date, paidTillDate: Date) {
  const cycles: CoveredBillingCycle[] = [];
  let cursor = toDateOnly(startDate);
  const end = toDateOnly(paidTillDate);

  while (cursor <= end) {
    const cycleEnd = getPaidTillDateForMonths(cursor, 1);
    if (cycleEnd > end) {
      break;
    }

    cycles.push({ month: cursor.getMonth(), year: cursor.getFullYear(), dueDate: cycleEnd });
    cursor = addDays(cycleEnd, 1);
  }

  return cycles;
}

export function formatDateInput(date: Date) {
  const dateOnly = toDateOnly(date);
  const year = dateOnly.getFullYear();
  const month = String(dateOnly.getMonth() + 1).padStart(2, '0');
  const day = String(dateOnly.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
