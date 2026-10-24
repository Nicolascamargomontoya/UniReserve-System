import express from 'express';
import { InMemoryUserRepository, InMemorySpaceRepository, InMemoryReservationRepository } from './repositories/InMemoryRepositories';
import { AuthService } from './services/AuthService';
import { SpaceService } from './services/SpaceService';
import { ReservationService } from './services/ReservationService';
import { AuthController, SpaceController, ReservationController } from './controllers';
import { authMiddleware, roleMiddleware } from './middleware/auth';

const app = express();
app.use(express.json());

// Repositories
const userRepo = new InMemoryUserRepository();
const spaceRepo = new InMemorySpaceRepository();
const resRepo = new InMemoryReservationRepository();

// Services
const authService = new AuthService(userRepo);
const spaceService = new SpaceService(spaceRepo);
const resService = new ReservationService(resRepo, spaceRepo);

// Controllers
const authCtrl = new AuthController(authService);
const spaceCtrl = new SpaceController(spaceService);
const resCtrl = new ReservationController(resService);

// Routes
app.post('/auth/register', (req, res) => authCtrl.register(req, res));
app.post('/auth/login', (req, res) => authCtrl.login(req, res));

app.get('/spaces', (req, res) => spaceCtrl.list(req, res));
app.post('/spaces', authMiddleware(authService), roleMiddleware(['Administrator']), (req, res) => spaceCtrl.create(req, res));

app.post('/reservations', authMiddleware(authService), roleMiddleware(['Student', 'Professor']), (req, res) => resCtrl.request(req, res));
app.get('/reservations/me', authMiddleware(authService), (req, res) => resCtrl.myReservations(req, res));
app.patch('/reservations/:id/approve', authMiddleware(authService), roleMiddleware(['Administrator']), (req, res) => resCtrl.approve(req, res));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`System running on http://localhost:${PORT}`);
});
