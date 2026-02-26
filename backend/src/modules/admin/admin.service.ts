import { forbidden, notFound, badRequest } from "../../common/errors";
import { UserRole } from "../auth/auth.types";
import { AdminRepository } from "./admin.repository";

export class AdminService {
  static async kpis(params: { societyId: string; role: UserRole }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can access KPIs.");
    return AdminRepository.kpis(params.societyId);
  }

  static async listUsers(params: { societyId: string; role: UserRole; query: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can list users.");
    const limit = Number(params.query.limit ?? 50);
    const offset = Number(params.query.offset ?? 0);
    const roleFilter = params.query.role ? String(params.query.role) : null;
    const statusFilter = params.query.status ? String(params.query.status) : null;

    return AdminRepository.listUsers({
      societyId: params.societyId,
      role: roleFilter,
      status: statusFilter,
      limit,
      offset
    });
  }

  static async createUser(params: { societyId: string; role: UserRole; body: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can create users.");
    return AdminRepository.createUser({
      societyId: params.societyId,
      fullName: params.body.fullName,
      phone: params.body.phone,
      email: params.body.email ?? null,
      role: params.body.role,
      status: params.body.status ?? "INVITED"
    });
  }

  static async updateUser(params: { societyId: string; role: UserRole; userId: string; patch: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can update users.");
    const out = await AdminRepository.updateUser({ societyId: params.societyId, userId: params.userId, patch: params.patch });
    if (!out) throw notFound("User not found or no changes.");
    return out;
  }

  static async listBlocks(params: { societyId: string; role: UserRole }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can manage blocks.");
    return AdminRepository.listBlocks(params.societyId);
  }

  static async createBlock(params: { societyId: string; role: UserRole; name: string }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can create blocks.");
    return AdminRepository.createBlock(params.societyId, params.name);
  }

  static async listFlats(params: { societyId: string; role: UserRole; blockId?: string | null }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can manage flats.");
    return AdminRepository.listFlats({ societyId: params.societyId, blockId: params.blockId ?? null });
  }

  static async createFlat(params: { societyId: string; role: UserRole; body: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can create flats.");
    const flat = await AdminRepository.createFlat({
      societyId: params.societyId,
      blockId: params.body.blockId,
      flatNumber: params.body.flatNumber,
      floor: params.body.floor ?? null
    });
    if (!flat) throw badRequest("Block not found in this society.");
    return flat;
  }
}
