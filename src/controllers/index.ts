import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { SpaceService } from '../services/SpaceService';
import { ReservationService } from '../services/ReservationService';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response) {
    try {
      const { email, password, fullName, role } = req.body;
      const user = await this.authService.register({ email, fullName, role }, password);
      res.status(201).json(user);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  }
}

export class SpaceController {
  constructor(private spaceService: SpaceService) {}

  async create(req: Request, res: Response) {
    try {
      const space = await this.spaceService.createSpace(req.body);
      res.status(201).json(space);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async list(req: Request, res: Response) {
    const spaces = await this.spaceService.getActiveSpaces();
    res.json(spaces);
  }
}

export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  async request(req: any, res: Response) {
    try {
      const { spaceId, start, end } = req.body;
      const userId = req.user.userId;
      const resv = await this.reservationService.requestReservation(
        userId,
        spaceId,
        new Date(start),
        new Date(end)
      );
      res.status(201).json(resv);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const resv = await this.reservationService.approveReservation(id);
      res.json(resv);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async myReservations(req: any, res: Response) {
    const userId = req.user.userId;
    const reservations = await this.reservationService.getUserReservations(userId);
    res.json(reservations);
  }
}
