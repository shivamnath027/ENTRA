"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesService = void 0;
const errors_1 = require("../../common/errors");
const vehicles_repository_1 = require("./vehicles.repository");
// Strategy #1: Registered vehicle allow
class RegisteredVehicleStrategy {
    name = "RegisteredVehicleStrategy";
    async evaluate(ctx) {
        const v = await vehicles_repository_1.VehiclesRepository.findVehicleByTagOrNumber({
            societyId: ctx.societyId,
            tagUid: ctx.tagUid ?? null,
            vehicleNumber: ctx.vehicleNumber ?? null
        });
        if (!v)
            return null;
        return {
            decision: "ALLOW",
            reason: "Registered vehicle",
            vehicleId: v.id,
            flatId: v.flat_id
        };
    }
}
// Strategy #2 (placeholder): Denylist / watchlist
// Later you can add table `denylist_vehicles` or `denylist_tags` and check here.
// For now we'll keep it as a template.
class DenylistStrategy {
    name = "DenylistStrategy";
    async evaluate(_ctx) {
        return null;
    }
}
// Strategy #3: Default = manual review
class DefaultManualReviewStrategy {
    name = "DefaultManualReviewStrategy";
    async evaluate(_ctx) {
        return {
            decision: "MANUAL_REVIEW",
            reason: "Unknown vehicle/tag: guard must verify"
        };
    }
}
// Access decision engine
class AccessDecisionEngine {
    strategies;
    constructor(strategies) {
        this.strategies = strategies;
    }
    async decide(ctx) {
        for (const s of this.strategies) {
            const res = await s.evaluate(ctx);
            if (res)
                return { ...res, strategy: s.name };
        }
        // Should never reach because DefaultManualReview returns result
        return { decision: "MANUAL_REVIEW", reason: "No matching strategy", strategy: "none" };
    }
}
// Singleton engine (easy to expand later)
const engine = new AccessDecisionEngine([
    new DenylistStrategy(),
    new RegisteredVehicleStrategy(),
    new DefaultManualReviewStrategy()
]);
class VehiclesService {
    static async createVehicle(params) {
        const { flatId } = params.body;
        // Allow: ADMIN can create for any flat; RESIDENT only for own flat
        if (params.role === "RESIDENT") {
            const ok = await vehicles_repository_1.VehiclesRepository.residentHasFlatAccess(params.userId, flatId);
            if (!ok)
                throw (0, errors_1.forbidden)("You do not belong to this flat.");
        }
        else if (params.role !== "ADMIN") {
            throw (0, errors_1.forbidden)("Only residents or admins can register vehicles.");
        }
        const vehicleNumber = params.body.vehicleNumber.trim().toUpperCase();
        if (params.body.tagType !== "NONE" && !params.body.tagUid) {
            throw (0, errors_1.badRequest)("tagUid is required when tagType is RFID/FASTAG.");
        }
        return vehicles_repository_1.VehiclesRepository.createVehicle({
            societyId: params.societyId,
            flatId,
            ownerUserId: params.role === "RESIDENT" ? params.userId : null,
            vehicleNumber,
            vehicleType: params.body.vehicleType,
            tagType: params.body.tagType ?? "NONE",
            tagUid: params.body.tagUid ?? null
        });
    }
    static async listVehicles(params) {
        // RESIDENT can list only own flat vehicles
        if (params.role === "RESIDENT") {
            if (!params.flatId)
                throw (0, errors_1.badRequest)("flatId is required for resident.");
            const ok = await vehicles_repository_1.VehiclesRepository.residentHasFlatAccess(params.userId, params.flatId);
            if (!ok)
                throw (0, errors_1.forbidden)("You do not belong to this flat.");
            return vehicles_repository_1.VehiclesRepository.listVehicles({ societyId: params.societyId, flatId: params.flatId, limit: params.limit, offset: params.offset });
        }
        // ADMIN can list all or filter by flatId
        if (params.role === "ADMIN") {
            return vehicles_repository_1.VehiclesRepository.listVehicles({ societyId: params.societyId, flatId: params.flatId ?? null, limit: params.limit, offset: params.offset });
        }
        // GUARD generally doesn’t need vehicle list
        throw (0, errors_1.forbidden)("Guards cannot list vehicles.");
    }
    static async updateVehicle(params) {
        const v = await vehicles_repository_1.VehiclesRepository.getVehicleById(params.vehicleId);
        if (!v)
            throw (0, errors_1.notFound)("Vehicle not found.");
        if (v.society_id !== params.societyId)
            throw (0, errors_1.forbidden)("Cross-society denied.");
        if (params.role === "RESIDENT") {
            const ok = await vehicles_repository_1.VehiclesRepository.residentHasFlatAccess(params.userId, v.flat_id);
            if (!ok)
                throw (0, errors_1.forbidden)("You do not belong to this flat.");
        }
        else if (params.role !== "ADMIN") {
            throw (0, errors_1.forbidden)("Only residents/admin can update vehicles.");
        }
        if (params.patch.tagType && params.patch.tagType !== "NONE" && params.patch.tagUid === undefined && !v.tag_uid) {
            throw (0, errors_1.badRequest)("tagUid required when tagType is RFID/FASTAG.");
        }
        return vehicles_repository_1.VehiclesRepository.updateVehicle(params.vehicleId, params.societyId, params.patch);
    }
    // Guard scan -> decision -> (optionally) open gate
    static async scanVehicle(params) {
        if (params.role !== "GUARD")
            throw (0, errors_1.forbidden)("Only guards can scan vehicles.");
        const { gateId, tagUid, vehicleNumber } = params.body;
        const decision = await engine.decide({
            societyId: params.societyId,
            gateId,
            tagUid: tagUid ?? null,
            vehicleNumber: vehicleNumber ?? null
        });
        const controller = await vehicles_repository_1.VehiclesRepository.getGateControllerByGateId(gateId);
        // Conceptual auto-open: only if ALLOW and controller exists
        // We won’t actually call the hardware here yet; we’ll return a command payload.
        const shouldAutoOpen = decision.decision === "ALLOW" && !!controller;
        const event = await vehicles_repository_1.VehiclesRepository.logAccessEvent({
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
                    controllerId: controller.id,
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
exports.VehiclesService = VehiclesService;
