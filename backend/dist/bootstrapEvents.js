"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventHandlers = registerEventHandlers;
const eventBus_1 = require("./common/events/eventBus");
const notifications_service_1 = require("./modules/notifications/notifications.service");
const db_1 = require("./config/db");
// Helper: notify all users in society (for notices)
async function getAllActiveUsersInSociety(societyId) {
    const r = await db_1.pool.query(`SELECT id FROM users WHERE society_id=$1 AND status='ACTIVE'`, [societyId]);
    return r.rows;
}
function registerEventHandlers() {
    // Visitor arrived -> notify flat
    eventBus_1.eventBus.on("VISITOR_ARRIVED", async (e) => {
        await notifications_service_1.NotificationsService.notifyFlatResidents({
            societyId: e.societyId,
            flatId: e.flatId,
            type: "VISITOR_ARRIVED",
            title: "Visitor at gate",
            body: `${e.visitorName} is at the gate.`,
            meta: { entryId: e.entryId, requestId: e.requestId ?? null }
        });
    });
    // Request decided -> notify flat
    eventBus_1.eventBus.on("VISITOR_REQUEST_DECIDED", async (e) => {
        await notifications_service_1.NotificationsService.notifyFlatResidents({
            societyId: e.societyId,
            flatId: e.flatId,
            type: e.status === "APPROVED" ? "VISITOR_REQUEST_APPROVED" : "VISITOR_REQUEST_REJECTED",
            title: e.status === "APPROVED" ? "Visitor approved" : "Visitor rejected",
            body: `${e.visitorName} was ${e.status.toLowerCase()}.`,
            meta: { requestId: e.requestId, status: e.status }
        });
    });
    // Notice posted -> notify whole society (in-app)
    eventBus_1.eventBus.on("NOTICE_POSTED", async (e) => {
        const users = await getAllActiveUsersInSociety(e.societyId);
        // We won’t reuse flat method; enqueue directly:
        const { NotificationsRepository } = await Promise.resolve().then(() => __importStar(require("./modules/notifications/notifications.repository")));
        for (const u of users) {
            await NotificationsRepository.enqueue({
                societyId: e.societyId,
                userId: u.id,
                type: "NOTICE_POSTED",
                title: "New notice",
                body: e.title,
                channel: "IN_APP",
                meta: { noticeId: e.noticeId }
            });
        }
    });
}
