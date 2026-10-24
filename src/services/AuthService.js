"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = 'super-secret-key';
class AuthService {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async register(data, password) {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing)
            throw new Error('Email already in use');
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        return this.userRepo.create({
            ...data,
            passwordHash,
            isActive: true
        });
    }
    async login(email, password) {
        const user = await this.userRepo.findByEmail(email);
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            throw new Error('Invalid credentials');
        }
        if (!user.isActive)
            throw new Error('Account is deactivated');
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        return { token, user };
    }
    generateToken(user) {
        return jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map