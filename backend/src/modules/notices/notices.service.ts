import { forbidden, notFound, badRequest } from "../../common/errors";
import { UserRole } from "../auth/auth.types";
import { NoticesRepository } from "./notices.repository";
import { eventBus } from "../../common/events/eventBus";

export class NoticesService {
  static async create(params: { societyId: string; userId: string; role: UserRole; body: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can post notices.");

    const visibleFrom = params.body.visibleFrom ? new Date(params.body.visibleFrom) : null;
    const visibleUntil = params.body.visibleUntil ? new Date(params.body.visibleUntil) : null;
    if (visibleFrom && visibleUntil && visibleFrom > visibleUntil) throw badRequest("visibleFrom must be <= visibleUntil");

    const notice = await NoticesRepository.create({
      societyId: params.societyId,
      postedByUserId: params.userId,
      title: params.body.title,
      content: params.body.content,
      pinned: params.body.pinned ?? false,
      visibleFrom,
      visibleUntil
    });

    // Emit event (Observer)
    await eventBus.emit({
      type: "NOTICE_POSTED",
      societyId: params.societyId,
      noticeId: notice.id,
      title: notice.title,
      postedByUserId: params.userId
    });

    return notice;
  }

  static async update(params: { societyId: string; role: UserRole; noticeId: string; patch: any }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can update notices.");
    const notice = await NoticesRepository.update({ societyId: params.societyId, noticeId: params.noticeId, patch: params.patch });
    if (!notice) throw notFound("Notice not found.");
    return notice;
  }

  static async delete(params: { societyId: string; role: UserRole; noticeId: string }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can delete notices.");
    const ok = await NoticesRepository.delete({ societyId: params.societyId, noticeId: params.noticeId });
    if (!ok) throw notFound("Notice not found.");
    return { ok: true };
  }

  static async list(params: { societyId: string; limit: number; offset: number }) {
    return NoticesRepository.list(params);
  }
}
