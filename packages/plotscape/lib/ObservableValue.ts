import { Observable, observable } from "./mixins/Observable";
import { Primitive } from "./types";

export interface ObservableValue<T> extends Observable {
  value: T;
  defaultValue: T;
  defaultize(): void;
  setValue(value: T): void;
  setValue(value: number | ((prev: T) => T)): void;
}

export function newObservableValue<T>(value: T): ObservableValue<T> {
  const props = { value, defaultValue: value };
  const methods = { defaultize, setValue };
  const self = { ...props, ...methods };

  return observable(self);
}

export function isObservable<T>(
  value: T | ObservableValue<T>
): value is ObservableValue<T> {
  return value && typeof value === `object` && `listen` in value;
}

export function getter<T>(source: T | ObservableValue<T>) {
  if (isObservable(source)) return () => source.value;
  return () => source;
}

export function defaultize<T>(this: ObservableValue<T>) {
  this.value = this.defaultValue;
  this.emit();
}

function setValue<T extends Primitive>(
  this: ObservableValue<T>,
  value: T | ((prev: T) => T)
) {
  this.value = typeof value != "function" ? value : value(this.value);
  this.emit();
}
