"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SDKErrors {
}
SDKErrors.errAccountNotInitialized = new Error("Account was not initialized");
SDKErrors.errRelayerServiceNotInitialized = new Error("Relayer service was not initialized");
SDKErrors.errStateTrackerServiceNotInitialized = new Error("State Tracker service was not initialized");
exports.default = SDKErrors;