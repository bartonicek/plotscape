import { Dict, Normalize } from "utils";

type Events = string;

export interface Emitter<T extends Events> {
  listeners: Record<T, Set<() => void>>;
  emit(type: T): this;
  listen(type: T, callback: () => void): this;
  remove(type: T, callback: () => void): this;
}

export function subscribable<T extends Events, U extends Dict>(
  object: U
): Normalize<U & Emitter<T>> {
  const listeners = {} as Record<T, Set<() => void>>;
  return { ...object, listeners, listen, emit, remove };
}

function emit<T extends Events>(this: Emitter<T>, type: T) {
  if (!this.listeners[type]) return this;
  for (const cb of this.listeners[type]) cb();
  return this;
}

function listen<T extends Events>(
  this: Emitter<T>,
  type: T,
  callback: () => void
) {
  if (!this.listeners[type]) this.listeners[type] = new Set();
  this.listeners[type].add(callback);
  return this;
}

function remove<T extends Events>(
  this: Emitter<T>,
  type: T,
  callback: () => void
) {
  if (!this.listeners[type]) return this;
  this.listeners[type].delete(callback);
  return this;
}
