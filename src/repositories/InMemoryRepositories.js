"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryReservationRepository = exports.InMemorySpaceRepository = exports.InMemoryUserRepository = void 0;
const uuid_1 = require("uuid");
class InMemoryUserRepository {
    users = new Map();
    async create(user) {
        const id = (0, uuid_1.v4)();
        const newUser = { ...user, id };
        this.users.set(id, newUser);
        return newUser;
    }
    async findByEmail(email) {
        return Array.from(this.users.values()).find(u => u.email === email) || null;
    }
    async findById(id) {
        return this.users.get(id) || null;
    }
    async update(id, updates) {
        const user = this.users.get(id);
        if (!user)
            throw new Error('User not found');
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
}
exports.InMemoryUserRepository = InMemoryUserRepository;
class InMemorySpaceRepository {
    spaces = new Map();
    async create(space) {
        const id = (0, uuid_1.v4)();
        const newSpace = { ...space, id };
        this.spaces.set(id, newSpace);
        return newSpace;
    }
    async findById(id) {
        return this.spaces.get(id) || null;
    }
    async findAllActive() {
        return Array.from(this.spaces.values()).filter(s => s.isActive);
    }
    async update(id, updates) {
        const space = this.spaces.get(id);
        if (!space)
            throw new Error('Space not found');
        const updatedSpace = { ...space, ...updates };
        this.spaces.set(id, updatedSpace);
        return updatedSpace;
    }
}
exports.InMemorySpaceRepository = InMemorySpaceRepository;
class InMemoryReservationRepository {
    reservations = new Map();
    async create(reservation) {
        const id = (0, uuid_1.v4)();
        const newRes = { ...reservation, id, createdAt: new Date() };
        this.reservations.set(id, newRes);
        return newRes;
    }
    async findById(id) {
        return this.reservations.get(id) || null;
    }
    async findByUserId(userId) {
        return Array.from(this.reservations.values()).filter(r => r.userId === userId);
    }
    async findOverlapping(spaceId, start, end) {
        return Array.from(this.reservations.values()).filter(r => r.spaceId === spaceId &&
            r.status === 'Approved' &&
            (start < r.endTime && end > r.startTime));
    }
    async update(id, updates) {
        const res = this.reservations.get(id);
        if (!res)
            throw new Error('Reservation not found');
        const updatedRes = { ...res, ...updates };
        this.reservations.set(id, updatedRes);
        return updatedRes;
    }
}
exports.InMemoryReservationRepository = InMemoryReservationRepository;
//# sourceMappingURL=InMemoryRepositories.js.map