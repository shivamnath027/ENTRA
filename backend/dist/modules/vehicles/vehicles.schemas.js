"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanVehicleSchema = exports.updateVehicleSchema = exports.createVehicleSchema = void 0;
const zod_1 = require("zod");
exports.createVehicleSchema = zod_1.z.object({
    flatId: zod_1.z.string().uuid(),
    vehicleNumber: zod_1.z.string().min(3).max(20),
    vehicleType: zod_1.z.enum(["CAR", "BIKE", "OTHER"]),
    tagType: zod_1.z.enum(["NONE", "RFID", "FASTAG"]).optional().default("NONE"),
    tagUid: zod_1.z.string().min(3).max(64).optional().nullable()
});
exports.updateVehicleSchema = zod_1.z.object({
    vehicleType: zod_1.z.enum(["CAR", "BIKE", "OTHER"]).optional(),
    tagType: zod_1.z.enum(["NONE", "RFID", "FASTAG"]).optional(),
    tagUid: zod_1.z.string().min(3).max(64).optional().nullable(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional()
});
exports.scanVehicleSchema = zod_1.z.object({
    gateId: zod_1.z.string().uuid(),
    tagUid: zod_1.z.string().min(3).max(64).optional().nullable(),
    vehicleNumber: zod_1.z.string().min(3).max(20).optional().nullable()
}).refine((v) => v.tagUid || v.vehicleNumber, {
    message: "Either tagUid or vehicleNumber must be provided."
});
