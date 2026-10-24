import { Reservation, ReservationStatus } from '../models';
import { ReservationRepository, SpaceRepository } from '../repositories/interfaces';

export class ReservationService {
  constructor(
    private resRepo: ReservationRepository,
    private spaceRepo: SpaceRepository
  ) {}

  async requestReservation(userId: string, spaceId: string, start: Date, end: Date): Promise<Reservation> {
    if (start >= end) throw new Error('End time must be after start time');
    if (start < new Date()) throw new Error('Start time must be in the future');

    const space = await this.spaceRepo.findById(spaceId);
    if (!space) throw new Error('Space not found');
    if (!space.isActive) throw new Error('Space is currently inactive');

    // Availability Validation & Conflict Prevention
    const overlaps = await this.resRepo.findOverlapping(spaceId, start, end);
    if (overlaps.length > 0) {
      throw new Error('Space not available for the selected time slot');
    }

    return this.resRepo.create({
      userId,
      spaceId,
      startTime: start,
      endTime: end,
      status: 'Pending'
    });
  }

  async approveReservation(id: string): Promise<Reservation> {
    return this.resRepo.update(id, { status: 'Approved' });
  }

  async rejectReservation(id: string): Promise<Reservation> {
    return this.resRepo.update(id, { status: 'Rejected' });
  }

  async cancelReservation(id: string, userId: string): Promise<Reservation> {
    const res = await this.resRepo.findById(id);
    if (!res) throw new Error('Reservation not found');
    if (res.userId !== userId) throw new Error('You can only cancel your own reservations');

    return this.resRepo.update(id, { status: 'Cancelled' });
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    return this.resRepo.findByUserId(userId);
  }
}
