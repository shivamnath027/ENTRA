"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.HttpError = void 0;
class HttpError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.HttpError = HttpError;
const badRequest = (msg) => new HttpError(400, msg);
exports.badRequest = badRequest;
const unauthorized = (msg) => new HttpError(401, msg);
exports.unauthorized = unauthorized;
const forbidden = (msg) => new HttpError(403, msg);
exports.forbidden = forbidden;
const notFound = (msg) => new HttpError(404, msg);
exports.notFound = notFound;
