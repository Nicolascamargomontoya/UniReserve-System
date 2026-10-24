import { User, UserRole } from '../models';
import { UserRepository } from '../repositories/interfaces';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super-secret-key';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async register(data: Omit<User, 'id' | 'passwordHash' | 'isActive'>, password: string): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    return this.userRepo.create({
      ...data,
      passwordHash,
      isActive: true
    });
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }
    if (!user.isActive) throw new Error('Account is deactivated');

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return { token, user };
  }

  generateToken(user: User): string {
    return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  }

  verifyToken(token: string): { userId: string; role: UserRole } {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
  }
}
