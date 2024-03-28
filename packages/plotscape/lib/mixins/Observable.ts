import { Dict, noopThis } from "utils";

export interface Observable {
  listeners: Set<() => void>;
  emit(): this;
  listen(callback: () => void): this;
  remove(callback: () => void): this;
}

export function observable<T extends Dict>(object: T): T & Observable {
  const listeners = new Set<() => void>();
  return { ...object, listeners, listen, emit, remove };
}

function emit(this: Observable) {
  for (const cb of this.listeners) cb();
  return this;
}

function listen(this: Observable, callback: () => void) {
  this.listeners.add(callback);
  return this;
}

function remove(this: Observable, callback: () => void) {
  this.listeners.delete(callback);
  return this;
}

export function untrack(emitter: Observable, callback: () => void) {
  const emitOriginal = emitter.emit;
  emitter.emit = noopThis;
  callback();
  emitter.emit = emitOriginal;
}
