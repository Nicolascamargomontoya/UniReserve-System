import { Space } from '../models';
import { SpaceRepository } from '../repositories/interfaces';
export declare class SpaceService {
    private spaceRepo;
    constructor(spaceRepo: SpaceRepository);
    createSpace(data: Omit<Space, 'id'>): Promise<Space>;
    updateSpace(id: string, data: Partial<Space>): Promise<Space>;
    getActiveSpaces(): Promise<Space[]>;
    getSpaceById(id: string): Promise<Space>;
}
//# sourceMappingURL=SpaceService.d.ts.map