"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceService = void 0;
class SpaceService {
    spaceRepo;
    constructor(spaceRepo) {
        this.spaceRepo = spaceRepo;
    }
    async createSpace(data) {
        return this.spaceRepo.create(data);
    }
    async updateSpace(id, data) {
        return this.spaceRepo.update(id, data);
    }
    async getActiveSpaces() {
        return this.spaceRepo.findAllActive();
    }
    async getSpaceById(id) {
        const space = await this.spaceRepo.findById(id);
        if (!space)
            throw new Error('Space not found');
        return space;
    }
}
exports.SpaceService = SpaceService;
//# sourceMappingURL=SpaceService.js.map