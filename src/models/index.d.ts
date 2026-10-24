export type UserRole = 'Student' | 'Professor' | 'Administrator';
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
}
export interface Space {
    id: string;
    name: string;
    type: 'lab' | 'auditorium' | 'room';
    capacity: number;
    location: string;
    equipment: string[];
    isActive: boolean;
}
export type ReservationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export interface Reservation {
    id: string;
    spaceId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    status: ReservationStatus;
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map