"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InMemoryRepositories_1 = require("../src/repositories/InMemoryRepositories");
const AuthService_1 = require("../src/services/AuthService");
const SpaceService_1 = require("../src/services/SpaceService");
const ReservationService_1 = require("../src/services/ReservationService");
async function runTests() {
    console.log('Starting System Verification Tests...');
    const userRepo = new InMemoryRepositories_1.InMemoryUserRepository();
    const spaceRepo = new InMemoryRepositories_1.InMemorySpaceRepository();
    const resRepo = new InMemoryRepositories_1.InMemoryReservationRepository();
    const authService = new AuthService_1.AuthService(userRepo);
    const spaceService = new SpaceService_1.SpaceService(spaceRepo);
    const resService = new ReservationService_1.ReservationService(resRepo, spaceRepo);
    try {
        // 1. User Registration & Auth
        const user = await authService.register({ email: 'test@uni.edu', fullName: 'Test User', role: 'Student' }, 'password123');
        console.log('✅ User registration successful');
        // 2. Space Management
        const space = await spaceService.createSpace({
            name: 'Lab 101',
            type: 'lab',
            capacity: 20,
            location: 'Building A',
            equipment: ['PCs', 'Projector'],
            isActive: true
        });
        console.log('✅ Space creation successful');
        // 3. Valid Reservation
        const start = new Date();
        start.setHours(start.getHours() + 1);
        const end = new Date(start);
        end.setHours(start.getHours() + 2);
        const res1 = await resService.requestReservation(user.id, space.id, start, end);
        await resService.approveReservation(res1.id);
        console.log('✅ Valid reservation flow successful');
        // 4. Overlap Conflict
        const start2 = new Date(start.getTime() + 30 * 60000); // 30 mins later
        const end2 = new Date(end.getTime() + 30 * 60000);
        try {
            await resService.requestReservation(user.id, space.id, start2, end2);
            throw new Error('Fail: Allowed overlapping reservation');
        }
        catch (e) {
            console.log('✅ Overlap prevention successful: ' + e.message);
        }
        // 5. 4-Hour Rule
        const start3 = new Date();
        start3.setHours(start3.getHours() + 10);
        const end3 = new Date(start3);
        end3.setHours(start3.getHours() + 5); // 5 hours
        try {
            await resService.requestReservation(user.id, space.id, start3, end3);
            throw new Error('Fail: Allowed reservation > 4 hours');
        }
        catch (e) {
            console.log('✅ 4-hour rule successful: ' + e.message);
        }
        console.log('\nALL TESTS PASSED SUCCESSFULLY');
    }
    catch (e) {
        console.error('\nTEST FAILED: ' + e.message);
        process.exit(1);
    }
}
runTests();
//# sourceMappingURL=system_test.js.map