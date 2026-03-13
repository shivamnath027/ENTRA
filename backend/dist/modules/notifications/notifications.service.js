"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const errors_1 = require("../../common/errors");
const notifications_repository_1 = require("./notifications.repository");
class NotificationsService {
    static async list(params) {
        return notifications_repository_1.NotificationsRepository.listForUser(params);
    }
    static async markRead(params) {
        const out = await notifications_repository_1.NotificationsRepository.markRead(params);
        if (!out)
            throw (0, errors_1.notFound)("Notification not found.");
        return out;
    }
    static async markAllRead(userId) {
        return notifications_repository_1.NotificationsRepository.markAllRead(userId);
    }
    // helper used by event handlers
    static async notifyFlatResidents(params) {
        const residents = await notifications_repository_1.NotificationsRepository.getResidentsForFlat(params.flatId);
        for (const r of residents) {
            await notifications_repository_1.NotificationsRepository.enqueue({
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
exports.NotificationsService = NotificationsService;
