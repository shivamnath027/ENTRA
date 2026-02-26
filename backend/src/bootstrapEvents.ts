import { eventBus } from "./common/events/eventBus";
import { NotificationsService } from "./modules/notifications/notifications.service";
import { pool } from "./config/db";

// Helper: notify all users in society (for notices)
async function getAllActiveUsersInSociety(societyId: string) {
  const r = await pool.query(
    `SELECT id FROM users WHERE society_id=$1 AND status='ACTIVE'`,
    [societyId]
  );
  return r.rows as Array<{ id: string }>;
}

export function registerEventHandlers() {
  // Visitor arrived -> notify flat
  eventBus.on("VISITOR_ARRIVED", async (e) => {
    await NotificationsService.notifyFlatResidents({
      societyId: e.societyId,
      flatId: e.flatId,
      type: "VISITOR_ARRIVED",
      title: "Visitor at gate",
      body: `${e.visitorName} is at the gate.`,
      meta: { entryId: e.entryId, requestId: e.requestId ?? null }
    });
  });

  // Request decided -> notify flat
  eventBus.on("VISITOR_REQUEST_DECIDED", async (e) => {
    await NotificationsService.notifyFlatResidents({
      societyId: e.societyId,
      flatId: e.flatId,
      type: e.status === "APPROVED" ? "VISITOR_REQUEST_APPROVED" : "VISITOR_REQUEST_REJECTED",
      title: e.status === "APPROVED" ? "Visitor approved" : "Visitor rejected",
      body: `${e.visitorName} was ${e.status.toLowerCase()}.`,
      meta: { requestId: e.requestId, status: e.status }
    });
  });

  // Notice posted -> notify whole society (in-app)
  eventBus.on("NOTICE_POSTED", async (e) => {
    const users = await getAllActiveUsersInSociety(e.societyId);
    // We won’t reuse flat method; enqueue directly:
    const { NotificationsRepository } = await import("./modules/notifications/notifications.repository");
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
