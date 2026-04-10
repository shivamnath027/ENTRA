import { z } from "zod";

export const createVehicleSchema = z.object({
  flatId: z.string().uuid(),
  vehicleNumber: z.string().min(3).max(20),
  vehicleType: z.enum(["CAR", "BIKE", "OTHER"]),
  tagType: z.enum(["NONE", "RFID", "FASTAG"]).optional().default("NONE"),
  tagUid: z.string().min(3).max(64).optional().nullable()
});

export const updateVehicleSchema = z.object({
  vehicleType: z.enum(["CAR", "BIKE", "OTHER"]).optional(),
  tagType: z.enum(["NONE", "RFID", "FASTAG"]).optional(),
  tagUid: z.string().min(3).max(64).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const scanVehicleSchema = z.object({
  tagUid: z.string().min(3).max(64).optional().nullable(),
  vehicleNumber: z.string().min(3).max(20).optional().nullable()
}).refine((v) => v.tagUid || v.vehicleNumber, {
  message: "Either tagUid or vehicleNumber must be provided."
});