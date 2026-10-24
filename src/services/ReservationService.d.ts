import { Reservation } from '../models';
import { ReservationRepository, SpaceRepository } from '../repositories/interfaces';
export declare class ReservationService {
    private resRepo;
    private spaceRepo;
    constructor(resRepo: ReservationRepository, spaceRepo: SpaceRepository);
    requestReservation(userId: string, spaceId: string, start: Date, end: Date): Promise<Reservation>;
    approveReservation(id: string): Promise<Reservation>;
    rejectReservation(id: string): Promise<Reservation>;
    cancelReservation(id: string, userId: string): Promise<Reservation>;
    getUserReservations(userId: string): Promise<Reservation[]>;
}
//# sourceMappingURL=ReservationService.d.ts.map