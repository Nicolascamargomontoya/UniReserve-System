"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = exports.SpaceController = exports.AuthController = void 0;
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(req, res) {
        try {
            const { email, password, fullName, role } = req.body;
            const user = await this.authService.register({ email, fullName, role }, password);
            res.status(201).json(user);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            res.json(result);
        }
        catch (e) {
            res.status(401).json({ error: e.message });
        }
    }
}
exports.AuthController = AuthController;
class SpaceController {
    spaceService;
    constructor(spaceService) {
        this.spaceService = spaceService;
    }
    async create(req, res) {
        try {
            const space = await this.spaceService.createSpace(req.body);
            res.status(201).json(space);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async list(req, res) {
        const spaces = await this.spaceService.getActiveSpaces();
        res.json(spaces);
    }
}
exports.SpaceController = SpaceController;
class ReservationController {
    reservationService;
    constructor(reservationService) {
        this.reservationService = reservationService;
    }
    async request(req, res) {
        try {
            const { spaceId, start, end } = req.body;
            const userId = req.user.userId;
            const resv = await this.reservationService.requestReservation(userId, spaceId, new Date(start), new Date(end));
            res.status(201).json(resv);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async approve(req, res) {
        try {
            const id = req.params.id;
            const resv = await this.reservationService.approveReservation(id);
            res.json(resv);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async myReservations(req, res) {
        const userId = req.user.userId;
        const reservations = await this.reservationService.getUserReservations(userId);
        res.json(reservations);
    }
}
exports.ReservationController = ReservationController;
//# sourceMappingURL=index.js.map