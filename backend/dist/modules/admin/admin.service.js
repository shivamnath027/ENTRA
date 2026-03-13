"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const errors_1 = require("../../common/errors");
const admin_repository_1 = require("./admin.repository");
class AdminService {
    static async kpis(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can access KPIs.");
        return admin_repository_1.AdminRepository.kpis(params.societyId);
    }
    static async listUsers(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can list users.");
        const limit = Number(params.query.limit ?? 50);
        const offset = Number(params.query.offset ?? 0);
        const roleFilter = params.query.role ? String(params.query.role) : null;
        const statusFilter = params.query.status ? String(params.query.status) : null;
        return admin_repository_1.AdminRepository.listUsers({
            societyId: params.societyId,
            role: roleFilter,
            status: statusFilter,
            limit,
            offset
        });
    }
    static async createUser(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can create users.");
        return admin_repository_1.AdminRepository.createUser({
            societyId: params.societyId,
            fullName: params.body.fullName,
            phone: params.body.phone,
            email: params.body.email ?? null,
            role: params.body.role,
            status: params.body.status ?? "INVITED"
        });
    }
    static async updateUser(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can update users.");
        const out = await admin_repository_1.AdminRepository.updateUser({ societyId: params.societyId, userId: params.userId, patch: params.patch });
        if (!out)
            throw (0, errors_1.notFound)("User not found or no changes.");
        return out;
    }
    static async listBlocks(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can manage blocks.");
        return admin_repository_1.AdminRepository.listBlocks(params.societyId);
    }
    static async createBlock(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can create blocks.");
        return admin_repository_1.AdminRepository.createBlock(params.societyId, params.name);
    }
    static async listFlats(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can manage flats.");
        return admin_repository_1.AdminRepository.listFlats({ societyId: params.societyId, blockId: params.blockId ?? null });
    }
    static async createFlat(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can create flats.");
        const flat = await admin_repository_1.AdminRepository.createFlat({
            societyId: params.societyId,
            blockId: params.body.blockId,
            flatNumber: params.body.flatNumber,
            floor: params.body.floor ?? null
        });
        if (!flat)
            throw (0, errors_1.badRequest)("Block not found in this society.");
        return flat;
    }
}
exports.AdminService = AdminService;
