"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticesService = void 0;
const errors_1 = require("../../common/errors");
const notices_repository_1 = require("./notices.repository");
const eventBus_1 = require("../../common/events/eventBus");
class NoticesService {
    static async create(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can post notices.");
        const visibleFrom = params.body.visibleFrom ? new Date(params.body.visibleFrom) : null;
        const visibleUntil = params.body.visibleUntil ? new Date(params.body.visibleUntil) : null;
        if (visibleFrom && visibleUntil && visibleFrom > visibleUntil)
            throw (0, errors_1.badRequest)("visibleFrom must be <= visibleUntil");
        const notice = await notices_repository_1.NoticesRepository.create({
            societyId: params.societyId,
            postedByUserId: params.userId,
            title: params.body.title,
            content: params.body.content,
            pinned: params.body.pinned ?? false,
            visibleFrom,
            visibleUntil
        });
        // Emit event (Observer)
        await eventBus_1.eventBus.emit({
            type: "NOTICE_POSTED",
            societyId: params.societyId,
            noticeId: notice.id,
            title: notice.title,
            postedByUserId: params.userId
        });
        return notice;
    }
    static async update(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can update notices.");
        const notice = await notices_repository_1.NoticesRepository.update({ societyId: params.societyId, noticeId: params.noticeId, patch: params.patch });
        if (!notice)
            throw (0, errors_1.notFound)("Notice not found.");
        return notice;
    }
    static async delete(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can delete notices.");
        const ok = await notices_repository_1.NoticesRepository.delete({ societyId: params.societyId, noticeId: params.noticeId });
        if (!ok)
            throw (0, errors_1.notFound)("Notice not found.");
        return { ok: true };
    }
    static async list(params) {
        return notices_repository_1.NoticesRepository.list(params);
    }
}
exports.NoticesService = NoticesService;
