import { ObjectId } from 'mongodb';
import { Shift, getShiftMeta, normalizeShift, shiftsConflict } from './shifts';

/**
 * Returns an error message when the requested seat+shift clashes with an
 * existing student, or null when the seat is free for those hours.
 * Part-time students may share a seat as long as their shifts don't overlap.
 */
export async function findSeatShiftConflict(
  studentsCollection: any,
  seatNumber: number,
  shift: Shift,
  excludeStudentId?: string
): Promise<string | null> {
  if (!seatNumber || Number.isNaN(seatNumber)) return null;

  const query: any = { seatNumber };
  if (excludeStudentId && ObjectId.isValid(excludeStudentId)) {
    query._id = { $ne: new ObjectId(excludeStudentId) };
  }

  const seatMates = await studentsCollection
    .find(query, { projection: { name: 1, shift: 1 } })
    .toArray();

  const clash = seatMates.find((mate: any) => shiftsConflict(shift, normalizeShift(mate.shift)));
  if (!clash) return null;

  const taken = getShiftMeta(clash.shift);
  const wanted = getShiftMeta(shift);

  return `Seat ${seatNumber} is already taken by ${clash.name} for the ${taken.label} shift (${taken.time}), which overlaps ${wanted.label}. Choose another seat or a different shift.`;
}
