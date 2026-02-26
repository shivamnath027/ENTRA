import { badRequest, forbidden, notFound } from "../../common/errors";
import { VisitorsRepository } from "./visitors.repository";
import { UserRole } from "../auth/auth.types";
import { eventBus } from "../../common/events/eventBus";

export class VisitorsService {
  // Resident creates a request
  static async createVisitorRequest(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    body: any;
  }) {
    if (params.role !== "RESIDENT") throw forbidden("Only residents can create requests.");

    const { flatId } = params.body;
    const ok = await VisitorsRepository.residentHasFlatAccess(params.userId, flatId);
    if (!ok) throw forbidden("You do not belong to this flat.");

    const expectedAt = params.body.expectedAt ? new Date(params.body.expectedAt) : null;
    const validFrom = params.body.validFrom ? new Date(params.body.validFrom) : null;
    const validUntil = params.body.validUntil ? new Date(params.body.validUntil) : null;

    if (validFrom && validUntil && validFrom > validUntil) throw badRequest("validFrom must be <= validUntil");

    const row = await VisitorsRepository.createVisitorRequest({
      societyId: params.societyId,
      flatId,
      createdByUserId: params.userId,
      visitorName: params.body.visitorName,
      visitorPhone: params.body.visitorPhone ?? null,
      vehicleNumber: params.body.vehicleNumber ?? null,
      purpose: params.body.purpose ?? null,
      expectedAt,
      validFrom,
      validUntil
    });

    return row;
  }

  static async listResidentRequests(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    flatId: string;
    limit: number;
    offset: number;
  }) {
    if (params.role !== "RESIDENT") throw forbidden("Only residents can view their flat requests.");
    const ok = await VisitorsRepository.residentHasFlatAccess(params.userId, params.flatId);
    if (!ok) throw forbidden("You do not belong to this flat.");

    return VisitorsRepository.listVisitorRequestsForFlat({
      societyId: params.societyId,
      flatId: params.flatId,
      limit: params.limit,
      offset: params.offset
    });
  }

  // Resident approves/rejects (usually triggered when guard registers arrival)
  static async decideOnRequest(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    requestId: string;
    decision: "APPROVE" | "REJECT";
    reason?: string | null;
  }) {
    const reqRow = await VisitorsRepository.getVisitorRequestById(params.requestId);
    if (!reqRow) throw notFound("Visitor request not found.");
    if (reqRow.society_id !== params.societyId) throw forbidden("Cross-society access denied.");

    // authorize:
    if (params.role === "RESIDENT") {
      const ok = await VisitorsRepository.residentHasFlatAccess(params.userId, reqRow.flat_id);
      if (!ok) throw forbidden("You do not belong to this flat.");
    } else if (params.role !== "ADMIN") {
      throw forbidden("Only residents (of the flat) or admins can decide.");
    }

    if (!["PENDING"].includes(reqRow.status)) {
      throw badRequest(`Request is not pending (current: ${reqRow.status}).`);
    }

    const status = params.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const updated = await VisitorsRepository.updateRequestDecision({
      requestId: params.requestId,
      status,
      approvedByUserId: params.userId,
      rejectedReason: status === "REJECTED" ? (params.reason ?? "Rejected") : null
    });

    // Notify all residents of the flat (in-app now; push later)
    // Emit event (Observer Pattern)
    await eventBus.emit({
      type: "VISITOR_REQUEST_DECIDED",
      societyId: params.societyId,
      flatId: updated.flat_id,
      requestId: updated.id,
      visitorName: updated.visitor_name,
      status: updated.status === "APPROVED" ? "APPROVED" : "REJECTED"
    });

    return updated;
  }

  // Guard lists requests
  static async listSocietyRequests(params: {
    societyId: string;
    role: UserRole;
    status?: string | null;
    limit: number;
    offset: number;
  }) {
    if (params.role !== "GUARD" && params.role !== "ADMIN") throw forbidden("Only guards/admin can view society requests.");

    return VisitorsRepository.listRequestsForSociety({
      societyId: params.societyId,
      status: params.status ?? null,
      limit: params.limit,
      offset: params.offset
    });
  }

  // Guard creates entry: from request OR ad-hoc
  static async createGateEntry(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    body: any;
  }) {
    if (params.role !== "GUARD") throw forbidden("Only guards can create gate entries.");

    const { gateId, visitorRequestId, flatId } = params.body;

    // if visitorRequestId provided, load request and derive details
    if (visitorRequestId) {
      const reqRow = await VisitorsRepository.getVisitorRequestById(visitorRequestId);
      if (!reqRow) throw notFound("Visitor request not found.");
      if (reqRow.society_id !== params.societyId) throw forbidden("Cross-society denied.");

      // Create entry in WAITING_APPROVAL unless already approved
      const status = reqRow.status === "APPROVED" ? "IN" : "WAITING_APPROVAL";
      const inAt = reqRow.status === "APPROVED" ? new Date() : null;

      const entry = await VisitorsRepository.createEntry({
        societyId: params.societyId,
        gateId,
        visitorRequestId,
        flatId: reqRow.flat_id,
        visitorName: reqRow.visitor_name,
        visitorPhone: reqRow.visitor_phone,
        vehicleNumber: reqRow.vehicle_number,
        purpose: reqRow.purpose,
        enteredByGuardId: params.userId,
        inPhotoUrl: params.body.inPhotoUrl ?? null,
        status,
        inAt
      });

      // Notify residents: visitor arrived / needs approval
      // Emit event (Observer Pattern)
      await eventBus.emit({
        type: "VISITOR_ARRIVED",
        societyId: params.societyId,
        flatId: entry.flat_id,
        entryId: entry.id,
        visitorName: entry.visitor_name,
        requestId: entry.visitor_request_id
      });

      return entry;
    }

    // Ad-hoc path requires explicit flat + visitor details
    if (!flatId) throw badRequest("flatId is required for ad-hoc entry.");
    if (!params.body.visitorName) throw badRequest("visitorName is required for ad-hoc entry.");

    const entry = await VisitorsRepository.createEntry({
      societyId: params.societyId,
      gateId,
      visitorRequestId: null,
      flatId,
      visitorName: params.body.visitorName,
      visitorPhone: params.body.visitorPhone ?? null,
      vehicleNumber: params.body.vehicleNumber ?? null,
      purpose: params.body.purpose ?? null,
      enteredByGuardId: params.userId,
      inPhotoUrl: params.body.inPhotoUrl ?? null,
      status: "WAITING_APPROVAL",
      inAt: null
    });

    // Notify residents for approval
    const residents = await VisitorsRepository.getResidentsForFlat(flatId);
    for (const r of residents) {
      await VisitorsRepository.enqueueNotification({
        societyId: params.societyId,
        userId: r.id,
        type: "ADHOC_VISITOR_ARRIVED",
        title: "Ad-hoc visitor at gate",
        body: `${params.body.visitorName} is requesting entry.`,
        channel: "IN_APP",
        meta: { entryId: entry.id, flatId }
      });
    }

    return entry;
  }

  static async markIn(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    entryId: string;
    inPhotoUrl?: string | null;
  }) {
    if (params.role !== "GUARD") throw forbidden("Only guards can mark IN.");
    const entry = await VisitorsRepository.getEntryById(params.entryId);
    if (!entry) throw notFound("Entry not found.");
    if (entry.society_id !== params.societyId) throw forbidden("Cross-society denied.");

    if (entry.status === "DENIED" || entry.status === "OUT") throw badRequest(`Cannot mark IN from ${entry.status}.`);

    // NOTE: In a stricter design, we'd ensure request is APPROVED before IN.
    // For MVP: guard marks IN after resident approval notification.
    return VisitorsRepository.markEntryIn({
      entryId: params.entryId,
      guardId: params.userId,
      inPhotoUrl: params.inPhotoUrl ?? null
    });
  }

  static async markOut(params: {
    societyId: string;
    role: UserRole;
    entryId: string;
    outPhotoUrl?: string | null;
  }) {
    if (params.role !== "GUARD") throw forbidden("Only guards can mark OUT.");
    const entry = await VisitorsRepository.getEntryById(params.entryId);
    if (!entry) throw notFound("Entry not found.");
    if (entry.society_id !== params.societyId) throw forbidden("Cross-society denied.");
    if (entry.status !== "IN") throw badRequest("Only IN entries can be marked OUT.");

    return VisitorsRepository.markEntryOut({
      entryId: params.entryId,
      outPhotoUrl: params.outPhotoUrl ?? null
    });
  }

  static async listEntries(params: {
    societyId: string;
    role: UserRole;
    gateId?: string | null;
    flatId?: string | null;
    from?: string | null;
    to?: string | null;
    limit: number;
    offset: number;
  }) {
    // guard/admin can view society logs; resident only their flat
    if (params.role === "RESIDENT") {
      if (!params.flatId) throw badRequest("flatId is required for residents.");
      // resident permission checked at controller/service call site (need userId); keep simple here:
    } else if (params.role !== "GUARD" && params.role !== "ADMIN") {
      throw forbidden("Not allowed.");
    }

    const from = params.from ? new Date(params.from) : null;
    const to = params.to ? new Date(params.to) : null;

    return VisitorsRepository.listEntries({
      societyId: params.societyId,
      gateId: params.gateId ?? null,
      flatId: params.flatId ?? null,
      from,
      to,
      limit: params.limit,
      offset: params.offset
    });
  }
}
