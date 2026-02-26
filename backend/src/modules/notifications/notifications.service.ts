import { notFound } from "../../common/errors";
import { NotificationsRepository } from "./notifications.repository";

export class NotificationsService {
  static async list(params: { userId: string; limit: number; offset: number; unreadOnly: boolean }) {
    return NotificationsRepository.listForUser(params);
  }

  static async markRead(params: { userId: string; notificationId: string }) {
    const out = await NotificationsRepository.markRead(params);
    if (!out) throw notFound("Notification not found.");
    return out;
  }

  static async markAllRead(userId: string) {
    return NotificationsRepository.markAllRead(userId);
  }

  // helper used by event handlers
  static async notifyFlatResidents(params: {
    societyId: string;
    flatId: string;
    type: string;
    title: string;
    body: string;
    meta?: any;
  }) {
    const residents = await NotificationsRepository.getResidentsForFlat(params.flatId);
    for (const r of residents) {
      await NotificationsRepository.enqueue({
        societyId: params.societyId,
        userId: r.id,
        type: params.type,
        title: params.title,
        body: params.body,
        channel: "IN_APP",
        meta: params.meta ?? null
      });
    }
  }
}
