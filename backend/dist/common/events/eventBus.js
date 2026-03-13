"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
class EventBus {
    handlers = {};
    on(type, handler) {
        if (!this.handlers[type])
            this.handlers[type] = [];
        this.handlers[type].push(handler);
    }
    async emit(event) {
        const list = this.handlers[event.type] ?? [];
        for (const h of list) {
            await h(event);
        }
    }
}
exports.EventBus = EventBus;
// singleton bus for app
exports.eventBus = new EventBus();
