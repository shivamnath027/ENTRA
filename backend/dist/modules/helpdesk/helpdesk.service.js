"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpdeskService = void 0;
const errors_1 = require("../../common/errors");
const helpdesk_repository_1 = require("./helpdesk.repository");
function computeSlaDueAt(priority) {
    const hours = priority === "URGENT" ? 6 :
        priority === "HIGH" ? 24 :
            priority === "MEDIUM" ? 48 :
                72;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}
class HelpdeskService {
    static async createTicket(params) {
        if (params.role !== "RESIDENT")
            throw (0, errors_1.forbidden)("Only residents can create tickets.");
        const ok = await helpdesk_repository_1.HelpdeskRepository.residentHasFlatAccess(params.userId, params.body.flatId);
        if (!ok)
            throw (0, errors_1.forbidden)("You do not belong to this flat.");
        const slaDueAt = computeSlaDueAt(params.body.priority);
        return helpdesk_repository_1.HelpdeskRepository.createTicket({
            societyId: params.societyId,
            flatId: params.body.flatId,
            createdByUserId: params.userId,
            type: params.body.type,
            priority: params.body.priority,
            description: params.body.description,
            slaDueAt
        });
    }
    static async listResidentTickets(params) {
        if (params.role !== "RESIDENT")
            throw (0, errors_1.forbidden)("Only residents can view flat tickets.");
        const ok = await helpdesk_repository_1.HelpdeskRepository.residentHasFlatAccess(params.userId, params.flatId);
        if (!ok)
            throw (0, errors_1.forbidden)("You do not belong to this flat.");
        return helpdesk_repository_1.HelpdeskRepository.listTicketsForFlat({
            societyId: params.societyId,
            flatId: params.flatId,
            status: params.status ?? null,
            limit: params.limit,
            offset: params.offset
        });
    }
    static async addComment(params) {
        const ticket = await helpdesk_repository_1.HelpdeskRepository.getTicketById(params.ticketId);
        if (!ticket)
            throw (0, errors_1.notFound)("Ticket not found.");
        if (ticket.society_id !== params.societyId)
            throw (0, errors_1.forbidden)("Cross-society denied.");
        // resident can comment only for their flat; admin can comment anywhere
        if (params.role === "RESIDENT") {
            const ok = await helpdesk_repository_1.HelpdeskRepository.residentHasFlatAccess(params.userId, ticket.flat_id);
            if (!ok)
                throw (0, errors_1.forbidden)("You do not belong to this flat.");
        }
        else if (params.role !== "ADMIN") {
            throw (0, errors_1.forbidden)("Only resident/admin can comment.");
        }
        return helpdesk_repository_1.HelpdeskRepository.addComment({ ticketId: params.ticketId, authorUserId: params.userId, message: params.message });
    }
    static async listComments(params) {
        const ticket = await helpdesk_repository_1.HelpdeskRepository.getTicketById(params.ticketId);
        if (!ticket)
            throw (0, errors_1.notFound)("Ticket not found.");
        if (ticket.society_id !== params.societyId)
            throw (0, errors_1.forbidden)("Cross-society denied.");
        if (params.role === "RESIDENT") {
            const ok = await helpdesk_repository_1.HelpdeskRepository.residentHasFlatAccess(params.userId, ticket.flat_id);
            if (!ok)
                throw (0, errors_1.forbidden)("You do not belong to this flat.");
        }
        else if (params.role !== "ADMIN") {
            throw (0, errors_1.forbidden)("Only resident/admin can view comments.");
        }
        return helpdesk_repository_1.HelpdeskRepository.listComments(params.ticketId, params.limit);
    }
    // Admin
    static async adminListTickets(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can view society tickets.");
        return helpdesk_repository_1.HelpdeskRepository.listTicketsForSociety(params);
    }
    static async assignTicket(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can assign tickets.");
        const out = await helpdesk_repository_1.HelpdeskRepository.assignTicket({
            societyId: params.societyId,
            ticketId: params.ticketId,
            assignedToUserId: params.assignedToUserId
        });
        if (!out)
            throw (0, errors_1.notFound)("Ticket not found.");
        return out;
    }
    static async updateStatus(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can update status.");
        // keep it simple: basic allowed transitions (optional)
        const allowed = new Set(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
        if (!allowed.has(params.status))
            throw (0, errors_1.badRequest)("Invalid status.");
        const out = await helpdesk_repository_1.HelpdeskRepository.updateStatus({
            societyId: params.societyId,
            ticketId: params.ticketId,
            status: params.status
        });
        if (!out)
            throw (0, errors_1.notFound)("Ticket not found.");
        return out;
    }
    static async summary(params) {
        if (params.role !== "ADMIN")
            throw (0, errors_1.forbidden)("Only admins can view summary.");
        return helpdesk_repository_1.HelpdeskRepository.summary({ societyId: params.societyId });
    }
}
exports.HelpdeskService = HelpdeskService;
