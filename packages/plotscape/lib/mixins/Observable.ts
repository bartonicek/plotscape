import { Dict, noopThis } from "utils";

/** Can be observed for changes. */
export interface Observable {
  observers: Set<() => void>;
  emit(): this;
  listen(callback: () => void): this;
  remove(callback: () => void): this;
}

export function observable<T extends Dict>(object: T): T & Observable {
  const observers = new Set<() => void>();
  return { ...object, observers, listen, emit, remove };
}

function emit(this: Observable) {
  for (const cb of this.observers) cb();
  return this;
}

function listen(this: Observable, callback: () => void) {
  this.observers.add(callback);
  return this;
}

function remove(this: Observable, callback: () => void) {
  this.observers.delete(callback);
  return this;
}

export function untrack(emitter: Observable, callback: () => void) {
  const emitOriginal = emitter.emit;
  emitter.emit = noopThis;
  callback();
  emitter.emit = emitOriginal;
}
