"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markReadSchema = void 0;
const zod_1 = require("zod");
exports.markReadSchema = zod_1.z.object({
    notificationId: zod_1.z.string().uuid()
});
