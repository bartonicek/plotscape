import { Emitter, subscribable } from "./mixins/Emitter";
import { Primitive } from "./types";

export interface ValueEmitter<T> extends Emitter<`changed`> {
  value: T;
  defaultValue: T;
  defaultize(): void;
  setValue(value: T): void;
  setValue(value: (prev: T) => T): void;
}

export function newValueEmitter<T>(value: T): ValueEmitter<T> {
  const props = { value, defaultValue: value };
  const methods = { defaultize, setValue };
  const self = { ...props, ...methods };

  return subscribable(self);
}

export function isEmitter<T>(
  value: T | ValueEmitter<T>
): value is ValueEmitter<T> {
  return value && typeof value === "object" && "value" in value;
}

export function getter<T>(source: T | ValueEmitter<T>) {
  if (isEmitter(source)) return () => source.value;
  return () => source;
}

export function defaultize<T>(this: ValueEmitter<T>) {
  this.value = this.defaultValue;
  this.emit(`changed`);
}

function setValue<T extends Primitive>(
  this: ValueEmitter<T>,
  value: T | ((prev: T) => T)
) {
  this.value = typeof value != "function" ? value : value(this.value);
  this.emit(`changed`);
}
