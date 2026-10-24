"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = void 0;
class ReservationService {
    resRepo;
    spaceRepo;
    constructor(resRepo, spaceRepo) {
        this.resRepo = resRepo;
        this.spaceRepo = spaceRepo;
    }
    async requestReservation(userId, spaceId, start, end) {
        if (start >= end)
            throw new Error('End time must be after start time');
        if (start < new Date())
            throw new Error('Start time must be in the future');
        // Rule: Maximum 4 consecutive hours
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (durationHours > 4) {
            throw new Error('Reservation cannot exceed 4 consecutive hours');
        }
        const space = await this.spaceRepo.findById(spaceId);
        if (!space)
            throw new Error('Space not found');
        if (!space.isActive)
            throw new Error('Space is currently inactive');
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
    async approveReservation(id) {
        return this.resRepo.update(id, { status: 'Approved' });
    }
    async rejectReservation(id) {
        return this.resRepo.update(id, { status: 'Rejected' });
    }
    async cancelReservation(id, userId) {
        const res = await this.resRepo.findById(id);
        if (!res)
            throw new Error('Reservation not found');
        if (res.userId !== userId)
            throw new Error('You can only cancel your own reservations');
        return this.resRepo.update(id, { status: 'Cancelled' });
    }
    async getUserReservations(userId) {
        return this.resRepo.findByUserId(userId);
    }
}
exports.ReservationService = ReservationService;
//# sourceMappingURL=ReservationService.js.map