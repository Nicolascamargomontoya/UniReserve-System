import { Space } from '../models';
import { SpaceRepository } from '../repositories/interfaces';

export class SpaceService {
  constructor(private spaceRepo: SpaceRepository) {}

  async createSpace(data: Omit<Space, 'id'>): Promise<Space> {
    return this.spaceRepo.create(data);
  }

  async updateSpace(id: string, data: Partial<Space>): Promise<Space> {
    return this.spaceRepo.update(id, data);
  }

  async getActiveSpaces(): Promise<Space[]> {
    return this.spaceRepo.findAllActive();
  }

  async getSpaceById(id: string): Promise<Space> {
    const space = await this.spaceRepo.findById(id);
    if (!space) throw new Error('Space not found');
    return space;
  }
}
