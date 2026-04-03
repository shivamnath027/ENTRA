import { unauthorized } from "../../common/errors";
import { UsersRepository } from "./users.repository";

export class UsersService {
  static async getMe(userId: string) {
    const row = await UsersRepository.getMeContext(userId);
    if (!row) throw unauthorized("User not found.");

    return {
      user: {
        id: row.user_id,
        fullName: row.full_name,
        phone: row.phone,
        email: row.email,
        role: row.role,
        societyId: row.society_id,
      },
      society: {
        id: row.society_id,
        name: row.society_name,
      },
      residentProfile: row.resident_flat_id
        ? {
            flatId: row.resident_flat_id,
            memberType: row.resident_member_type,
            isPrimary: row.resident_is_primary,
          }
        : null,
      flat: row.flat_id
        ? {
            id: row.flat_id,
            flatNumber: row.flat_number,
          }
        : null,
      block: row.block_id
        ? {
            id: row.block_id,
            name: row.block_name,
          }
        : null,
    };
  }
}