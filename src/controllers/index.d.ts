import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { SpaceService } from '../services/SpaceService';
import { ReservationService } from '../services/ReservationService';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
}
export declare class SpaceController {
    private spaceService;
    constructor(spaceService: SpaceService);
    create(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<void>;
}
export declare class ReservationController {
    private reservationService;
    constructor(reservationService: ReservationService);
    request(req: any, res: Response): Promise<void>;
    approve(req: Request, res: Response): Promise<void>;
    myReservations(req: any, res: Response): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map