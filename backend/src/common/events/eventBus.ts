import { DomainEvent } from "./events";

type Handler<T extends DomainEvent["type"]> = (event: Extract<DomainEvent, { type: T }>) => Promise<void> | void;

export class EventBus {
  private handlers: { [K in DomainEvent["type"]]?: Handler<any>[] } = {};

  on<T extends DomainEvent["type"]>(type: T, handler: Handler<T>) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type]!.push(handler as any);
  }

  async emit(event: DomainEvent) {
    const list = this.handlers[event.type] ?? [];
    for (const h of list) {
      await h(event as any);
    }
  }
}

// singleton bus for app
export const eventBus = new EventBus();
