import { User, Space, Reservation } from '../models';
import { UserRepository, SpaceRepository, ReservationRepository } from './interfaces';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async create(user: Omit<User, 'id'>): Promise<User> {
    const id = uuidv4();
    const newUser = { ...user, id } as User;
    this.users.set(id, newUser);
    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

export class InMemorySpaceRepository implements SpaceRepository {
  private spaces: Map<string, Space> = new Map();

  async create(space: Omit<Space, 'id'>): Promise<Space> {
    const id = uuidv4();
    const newSpace = { ...space, id } as Space;
    this.spaces.set(id, newSpace);
    return newSpace;
  }

  async findById(id: string): Promise<Space | null> {
    return this.spaces.get(id) || null;
  }

  async findAllActive(): Promise<Space[]> {
    return Array.from(this.spaces.values()).filter(s => s.isActive);
  }

  async update(id: string, updates: Partial<Space>): Promise<Space> {
    const space = this.spaces.get(id);
    if (!space) throw new Error('Space not found');
    const updatedSpace = { ...space, ...updates };
    this.spaces.set(id, updatedSpace);
    return updatedSpace;
  }
}

export class InMemoryReservationRepository implements ReservationRepository {
  private reservations: Map<string, Reservation> = new Map();

  async create(reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
    const id = uuidv4();
    const newRes = { ...reservation, id, createdAt: new Date() } as Reservation;
    this.reservations.set(id, newRes);
    return newRes;
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.reservations.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(r => r.userId === userId);
  }

  async findOverlapping(spaceId: string, start: Date, end: Date): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(r =>
      r.spaceId === spaceId &&
      r.status === 'Approved' &&
      (start < r.endTime && end > r.startTime)
    );
  }

  async update(id: string, updates: Partial<Reservation>): Promise<Reservation> {
    const res = this.reservations.get(id);
    if (!res) throw new Error('Reservation not found');
    const updatedRes = { ...res, ...updates };
    this.reservations.set(id, updatedRes);
    return updatedRes;
  }
}
