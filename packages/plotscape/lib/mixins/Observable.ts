import { Dict, noopThis } from "utils";

/** Can be observed for changes. */
export interface Observable {
  observers: Set<() => void>;
  emit<T extends this>(): T;
  listen<T extends this>(callback: () => void): T;
  remove<T extends this>(callback: () => void): T;
}

export function observable<T extends Dict>(object: T): T & Observable {
  const observers = new Set<() => void>();
  return { ...object, observers, listen, emit, remove };
}

function emit<T extends Observable>(this: T) {
  for (const cb of this.observers) cb();
  return this;
}

function listen<T extends Observable>(this: T, callback: () => void) {
  this.observers.add(callback);
  return this;
}

function remove<T extends Observable>(this: T, callback: () => void) {
  this.observers.delete(callback);
  return this;
}

export function untrack(emitter: Observable, callback: () => void) {
  const emitOriginal = emitter.emit;
  emitter.emit = noopThis;
  callback();
  emitter.emit = emitOriginal;
}
