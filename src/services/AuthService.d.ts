import { User, UserRole } from '../models';
import { UserRepository } from '../repositories/interfaces';
export declare class AuthService {
    private userRepo;
    constructor(userRepo: UserRepository);
    register(data: Omit<User, 'id' | 'passwordHash' | 'isActive'>, password: string): Promise<User>;
    login(email: string, password: string): Promise<{
        token: string;
        user: User;
    }>;
    generateToken(user: User): string;
    verifyToken(token: string): {
        userId: string;
        role: UserRole;
    };
}
//# sourceMappingURL=AuthService.d.ts.map