import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}
export declare function authMiddleware(authService: AuthService): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function roleMiddleware(allowedRoles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map