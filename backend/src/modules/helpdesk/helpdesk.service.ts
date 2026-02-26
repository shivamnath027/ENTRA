import { badRequest, forbidden, notFound } from "../../common/errors";
import { UserRole } from "../auth/auth.types";
import { HelpdeskRepository } from "./helpdesk.repository";

function computeSlaDueAt(priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"): Date {
  const hours =
    priority === "URGENT" ? 6 :
    priority === "HIGH" ? 24 :
    priority === "MEDIUM" ? 48 :
    72;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export class HelpdeskService {
  static async createTicket(params: { societyId: string; userId: string; role: UserRole; body: any }) {
    if (params.role !== "RESIDENT") throw forbidden("Only residents can create tickets.");

    const ok = await HelpdeskRepository.residentHasFlatAccess(params.userId, params.body.flatId);
    if (!ok) throw forbidden("You do not belong to this flat.");

    const slaDueAt = computeSlaDueAt(params.body.priority);

    return HelpdeskRepository.createTicket({
      societyId: params.societyId,
      flatId: params.body.flatId,
      createdByUserId: params.userId,
      type: params.body.type,
      priority: params.body.priority,
      description: params.body.description,
      slaDueAt
    });
  }

  static async listResidentTickets(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    flatId: string;
    status?: string | null;
    limit: number;
    offset: number;
  }) {
    if (params.role !== "RESIDENT") throw forbidden("Only residents can view flat tickets.");
    const ok = await HelpdeskRepository.residentHasFlatAccess(params.userId, params.flatId);
    if (!ok) throw forbidden("You do not belong to this flat.");

    return HelpdeskRepository.listTicketsForFlat({
      societyId: params.societyId,
      flatId: params.flatId,
      status: params.status ?? null,
      limit: params.limit,
      offset: params.offset
    });
  }

  static async addComment(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    ticketId: string;
    message: string;
  }) {
    const ticket = await HelpdeskRepository.getTicketById(params.ticketId);
    if (!ticket) throw notFound("Ticket not found.");
    if (ticket.society_id !== params.societyId) throw forbidden("Cross-society denied.");

    // resident can comment only for their flat; admin can comment anywhere
    if (params.role === "RESIDENT") {
      const ok = await HelpdeskRepository.residentHasFlatAccess(params.userId, ticket.flat_id);
      if (!ok) throw forbidden("You do not belong to this flat.");
    } else if (params.role !== "ADMIN") {
      throw forbidden("Only resident/admin can comment.");
    }

    return HelpdeskRepository.addComment({ ticketId: params.ticketId, authorUserId: params.userId, message: params.message });
  }

  static async listComments(params: { societyId: string; userId: string; role: UserRole; ticketId: string; limit: number }) {
    const ticket = await HelpdeskRepository.getTicketById(params.ticketId);
    if (!ticket) throw notFound("Ticket not found.");
    if (ticket.society_id !== params.societyId) throw forbidden("Cross-society denied.");

    if (params.role === "RESIDENT") {
      const ok = await HelpdeskRepository.residentHasFlatAccess(params.userId, ticket.flat_id);
      if (!ok) throw forbidden("You do not belong to this flat.");
    } else if (params.role !== "ADMIN") {
      throw forbidden("Only resident/admin can view comments.");
    }

    return HelpdeskRepository.listComments(params.ticketId, params.limit);
  }

  // Admin
  static async adminListTickets(params: {
    societyId: string;
    role: UserRole;
    status?: string | null;
    priority?: string | null;
    type?: string | null;
    overdue?: boolean | null;
    limit: number;
    offset: number;
  }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can view society tickets.");
    return HelpdeskRepository.listTicketsForSociety(params);
  }

  static async assignTicket(params: { societyId: string; role: UserRole; ticketId: string; assignedToUserId: string }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can assign tickets.");
    const out = await HelpdeskRepository.assignTicket({
      societyId: params.societyId,
      ticketId: params.ticketId,
      assignedToUserId: params.assignedToUserId
    });
    if (!out) throw notFound("Ticket not found.");
    return out;
  }

  static async updateStatus(params: { societyId: string; role: UserRole; ticketId: string; status: string }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can update status.");

    // keep it simple: basic allowed transitions (optional)
    const allowed = new Set(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
    if (!allowed.has(params.status)) throw badRequest("Invalid status.");

    const out = await HelpdeskRepository.updateStatus({
      societyId: params.societyId,
      ticketId: params.ticketId,
      status: params.status
    });
    if (!out) throw notFound("Ticket not found.");
    return out;
  }

  static async summary(params: { societyId: string; role: UserRole }) {
    if (params.role !== "ADMIN") throw forbidden("Only admins can view summary.");
    return HelpdeskRepository.summary({ societyId: params.societyId });
  }
}
