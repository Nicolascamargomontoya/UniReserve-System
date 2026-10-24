"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InMemoryRepositories_1 = require("./repositories/InMemoryRepositories");
const AuthService_1 = require("./services/AuthService");
const SpaceService_1 = require("./services/SpaceService");
const ReservationService_1 = require("./services/ReservationService");
const controllers_1 = require("./controllers");
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Repositories
const userRepo = new InMemoryRepositories_1.InMemoryUserRepository();
const spaceRepo = new InMemoryRepositories_1.InMemorySpaceRepository();
const resRepo = new InMemoryRepositories_1.InMemoryReservationRepository();
// Services
const authService = new AuthService_1.AuthService(userRepo);
const spaceService = new SpaceService_1.SpaceService(spaceRepo);
const resService = new ReservationService_1.ReservationService(resRepo, spaceRepo);
// Controllers
const authCtrl = new controllers_1.AuthController(authService);
const spaceCtrl = new controllers_1.SpaceController(spaceService);
const resCtrl = new controllers_1.ReservationController(resService);
// Routes
app.post('/auth/register', (req, res) => authCtrl.register(req, res));
app.post('/auth/login', (req, res) => authCtrl.login(req, res));
app.get('/spaces', (req, res) => spaceCtrl.list(req, res));
app.post('/spaces', (0, auth_1.authMiddleware)(authService), (0, auth_1.roleMiddleware)(['Administrator']), (req, res) => spaceCtrl.create(req, res));
app.post('/reservations', (0, auth_1.authMiddleware)(authService), (0, auth_1.roleMiddleware)(['Student', 'Professor']), (req, res) => resCtrl.request(req, res));
app.get('/reservations/me', (0, auth_1.authMiddleware)(authService), (req, res) => resCtrl.myReservations(req, res));
app.patch('/reservations/:id/approve', (0, auth_1.authMiddleware)(authService), (0, auth_1.roleMiddleware)(['Administrator']), (req, res) => resCtrl.approve(req, res));
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`System running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map