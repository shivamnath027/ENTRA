import { forbidden, notFound, badRequest } from "../../common/errors";
import { UserRole } from "../auth/auth.types";
import { VehiclesRepository } from "./vehicles.repository";

// Decision result type
type AccessDecision = {
  decision: "ALLOW" | "DENY" | "MANUAL_REVIEW";
  reason: string;
  vehicleId?: string | null;
  flatId?: string | null;
};

// ---- Strategy Pattern ----
interface AccessStrategy {
  name: string;
  evaluate(ctx: {
    societyId: string;
    gateId: string;
    tagUid?: string | null;
    vehicleNumber?: string | null;
  }): Promise<AccessDecision | null>; // null = strategy not applicable
}

// Strategy #1: Registered vehicle allow
class RegisteredVehicleStrategy implements AccessStrategy {
  name = "RegisteredVehicleStrategy";

  async evaluate(ctx: {
    societyId: string;
    gateId: string;
    tagUid?: string | null;
    vehicleNumber?: string | null;
  }): Promise<AccessDecision | null> {
    const v = await VehiclesRepository.findVehicleByTagOrNumber({
      societyId: ctx.societyId,
      tagUid: ctx.tagUid ?? null,
      vehicleNumber: ctx.vehicleNumber ?? null
    });

    if (!v) return null;

    return {
      decision: "ALLOW" as const,
      reason: "Registered vehicle",
      vehicleId: v.id,
      flatId: v.flat_id
    };
  }
}


// Strategy #2 (placeholder): Denylist / watchlist
// Later you can add table `denylist_vehicles` or `denylist_tags` and check here.
// For now we'll keep it as a template.
class DenylistStrategy implements AccessStrategy {
  name = "DenylistStrategy";
  async evaluate(_ctx: any) {
    return null;
  }
}

// Strategy #3: Default = manual review
class DefaultManualReviewStrategy implements AccessStrategy {
  name = "DefaultManualReviewStrategy";

  async evaluate(_ctx: {
    societyId: string;
    gateId: string;
    tagUid?: string | null;
    vehicleNumber?: string | null;
  }): Promise<AccessDecision | null> {
    return {
      decision: "MANUAL_REVIEW" as const,
      reason: "Unknown vehicle/tag: guard must verify"
    };
  }
}


// Access decision engine
class AccessDecisionEngine {
  private strategies: AccessStrategy[];
  constructor(strategies: AccessStrategy[]) {
    this.strategies = strategies;
  }
  async decide(ctx: { societyId: string; gateId: string; tagUid?: string | null; vehicleNumber?: string | null }) {
    for (const s of this.strategies) {
      const res = await s.evaluate(ctx);
      if (res) return { ...res, strategy: s.name };
    }
    // Should never reach because DefaultManualReview returns result
    return { decision: "MANUAL_REVIEW" as const, reason: "No matching strategy", strategy: "none" };
  }
}

// Singleton engine (easy to expand later)
const engine = new AccessDecisionEngine([
  new DenylistStrategy(),
  new RegisteredVehicleStrategy(),
  new DefaultManualReviewStrategy()
]);

export class VehiclesService {
  static async createVehicle(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    body: any;
  }) {
    const { flatId } = params.body;

    // Allow: ADMIN can create for any flat; RESIDENT only for own flat
    if (params.role === "RESIDENT") {
      const ok = await VehiclesRepository.residentHasFlatAccess(params.userId, flatId);
      if (!ok) throw forbidden("You do not belong to this flat.");
    } else if (params.role !== "ADMIN") {
      throw forbidden("Only residents or admins can register vehicles.");
    }

    const vehicleNumber = params.body.vehicleNumber.trim().toUpperCase();
    if (params.body.tagType !== "NONE" && !params.body.tagUid) {
      throw badRequest("tagUid is required when tagType is RFID/FASTAG.");
    }

    return VehiclesRepository.createVehicle({
      societyId: params.societyId,
      flatId,
      ownerUserId: params.role === "RESIDENT" ? params.userId : null,
      vehicleNumber,
      vehicleType: params.body.vehicleType,
      tagType: params.body.tagType ?? "NONE",
      tagUid: params.body.tagUid ?? null
    });
  }

  static async listVehicles(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    flatId?: string | null;
    limit: number;
    offset: number;
  }) {
    // RESIDENT can list only own flat vehicles
    if (params.role === "RESIDENT") {
      if (!params.flatId) throw badRequest("flatId is required for resident.");
      const ok = await VehiclesRepository.residentHasFlatAccess(params.userId, params.flatId);
      if (!ok) throw forbidden("You do not belong to this flat.");
      return VehiclesRepository.listVehicles({ societyId: params.societyId, flatId: params.flatId, limit: params.limit, offset: params.offset });
    }

    // ADMIN can list all or filter by flatId
    if (params.role === "ADMIN") {
      return VehiclesRepository.listVehicles({ societyId: params.societyId, flatId: params.flatId ?? null, limit: params.limit, offset: params.offset });
    }

    // GUARD generally doesn’t need vehicle list
    throw forbidden("Guards cannot list vehicles.");
  }

  static async updateVehicle(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    vehicleId: string;
    patch: any;
  }) {
    const v = await VehiclesRepository.getVehicleById(params.vehicleId);
    if (!v) throw notFound("Vehicle not found.");
    if (v.society_id !== params.societyId) throw forbidden("Cross-society denied.");

    if (params.role === "RESIDENT") {
      const ok = await VehiclesRepository.residentHasFlatAccess(params.userId, v.flat_id);
      if (!ok) throw forbidden("You do not belong to this flat.");
    } else if (params.role !== "ADMIN") {
      throw forbidden("Only residents/admin can update vehicles.");
    }

    if (params.patch.tagType && params.patch.tagType !== "NONE" && params.patch.tagUid === undefined && !v.tag_uid) {
      throw badRequest("tagUid required when tagType is RFID/FASTAG.");
    }

    return VehiclesRepository.updateVehicle(params.vehicleId, params.societyId, params.patch);
  }

  // Guard scan -> decision -> (optionally) open gate
  static async scanVehicle(params: {
    societyId: string;
    userId: string;
    role: UserRole;
    body: any;
  }) {
    if (params.role !== "GUARD") throw forbidden("Only guards can scan vehicles.");

    const { gateId, tagUid, vehicleNumber } = params.body;

    const decision = await engine.decide({
      societyId: params.societyId,
      gateId,
      tagUid: tagUid ?? null,
      vehicleNumber: vehicleNumber ?? null
    });

    const controller = await VehiclesRepository.getGateControllerByGateId(gateId);

    // Conceptual auto-open: only if ALLOW and controller exists
    // We won’t actually call the hardware here yet; we’ll return a command payload.
    const shouldAutoOpen = decision.decision === "ALLOW" && !!controller;

    const event = await VehiclesRepository.logAccessEvent({
      societyId: params.societyId,
      gateId,
      controllerId: controller?.id ?? null,
      scannedByGuardId: params.userId,
      tagUid: tagUid ?? null,
      vehicleNumber: vehicleNumber ?? null,
      vehicleId: decision.vehicleId ?? null,
      flatId: decision.flatId ?? null,
      decision: decision.decision,
      reason: decision.reason,
      openedGate: shouldAutoOpen
    });

    return {
      decision: decision.decision,
      reason: decision.reason,
      resolved: { vehicleId: decision.vehicleId ?? null, flatId: decision.flatId ?? null },
      autoOpen: shouldAutoOpen
        ? {
            controllerId: controller!.id,
            gateId,
            command: "OPEN_GATE",
            // Your guard app can either show “Auto-open triggered”
            // or call a backend endpoint that triggers controller command.
            note: "Controller configured; auto-open permitted."
          }
        : null,
      eventId: event.id
    };
  }
}
