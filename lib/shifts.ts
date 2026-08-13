export type Shift = 'full' | 'morning' | 'afternoon' | 'evening';

export const SHIFTS: {
  value: Shift;
  label: string;
  time: string;
  icon: string;
  badge: string;
  /** Share of the full-day fee charged for this shift. Used only as a suggestion. */
  feeFactor: number;
}[] = [
  { value: 'full', label: 'Full Day', time: '6:00 AM – 10:00 PM', icon: '☀️', badge: 'bg-blue-100 text-blue-700 border-blue-200', feeFactor: 1 },
  { value: 'morning', label: 'Morning', time: '6:00 AM – 12:00 PM', icon: '🌅', badge: 'bg-amber-100 text-amber-700 border-amber-200', feeFactor: 0.5 },
  { value: 'afternoon', label: 'Afternoon', time: '12:00 PM – 5:00 PM', icon: '🌤️', badge: 'bg-orange-100 text-orange-700 border-orange-200', feeFactor: 0.5 },
  { value: 'evening', label: 'Evening', time: '5:00 PM – 10:00 PM', icon: '🌙', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', feeFactor: 0.5 },
];

/** Suggested monthly fee for a shift, derived from the full-day rate. */
export function suggestedShiftFee(baseMonthlyFee: number, shift: Shift) {
  const factor = getShiftMeta(shift).feeFactor;
  return Math.round(Number(baseMonthlyFee || 0) * factor);
}

// Shifts a part-time student can pick (everything except the whole-day option)
export const PART_TIME_SHIFTS = SHIFTS.filter((shift) => shift.value !== 'full');

export const SHIFT_VALUES = SHIFTS.map((shift) => shift.value);

export function isShift(value: unknown): value is Shift {
  return typeof value === 'string' && SHIFT_VALUES.includes(value as Shift);
}

export function normalizeShift(value: unknown): Shift {
  return isShift(value) ? value : 'full';
}

export function getShiftMeta(value: unknown) {
  const shift = normalizeShift(value);
  return SHIFTS.find((item) => item.value === shift)!;
}

/**
 * Two students can share a seat only when their hours don't overlap.
 * A full-day booking blocks the seat for everyone; otherwise only the
 * same named shift clashes.
 */
export function shiftsConflict(a: Shift, b: Shift) {
  return a === 'full' || b === 'full' || a === b;
}

/** Shifts still bookable on a seat, given the shifts already taken on it. */
export function availableShifts(takenShifts: Shift[]) {
  return SHIFTS.filter((shift) => !takenShifts.some((taken) => shiftsConflict(shift.value, taken)));
}
