import { User, Space, Reservation } from '../models';
export interface UserRepository {
    create(user: Omit<User, 'id'>): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(id: string, updates: Partial<User>): Promise<User>;
}
export interface SpaceRepository {
    create(space: Omit<Space, 'id'>): Promise<Space>;
    findById(id: string): Promise<Space | null>;
    findAllActive(): Promise<Space[]>;
    update(id: string, updates: Partial<Space>): Promise<Space>;
}
export interface ReservationRepository {
    create(reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation>;
    findById(id: string): Promise<Reservation | null>;
    findByUserId(userId: string): Promise<Reservation[]>;
    findOverlapping(spaceId: string, start: Date, end: Date): Promise<Reservation[]>;
    update(id: string, updates: Partial<Reservation>): Promise<Reservation>;
}
//# sourceMappingURL=interfaces.d.ts.map