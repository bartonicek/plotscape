import { Primitive } from "../types";
import { newValueWidget } from "../widgets/ValueWidget";
import { Widget } from "../widgets/Widget";
import { Named, named } from "./Named";
import { Observable, observable } from "./Observable";

export interface ObservableValue<T> extends Named, Observable {
  value: T;
  defaultValue: T;
  defaultize(): this;
  set(value: T): this;
  set(value: number | ((prev: T) => T)): this;
  widget(): Widget;
}

export function newObservableValue<T>(value: T): ObservableValue<T> {
  const props = { value, defaultValue: value };
  const methods = { defaultize, set, widget };
  const self = { ...props, ...methods };

  return observable(named(self));
}

function defaultize<T>(this: ObservableValue<T>) {
  this.value = this.defaultValue;
  this.emit();
  return this;
}

function set<T extends Primitive>(
  this: ObservableValue<T>,
  value: T | ((prev: T) => T)
) {
  this.value = typeof value != "function" ? value : value(this.value);
  this.emit();
  return this;
}

function widget<T extends number>(this: ObservableValue<T>) {
  const source = observable({ value: this.value });
  const widget = newValueWidget(source).setName(this.name());

  this.listen(() => {
    source.value = this.value;
    source.emit();
  });

  widget.listen(() => {
    this.value = widget.value;
    this.emit();
  });

  return widget;
}

export function isObservable<T>(
  value?: T | ObservableValue<T>
): value is ObservableValue<T> {
  if (value === undefined) return false;
  return value && typeof value === `object` && `listen` in value;
}

export function getter<T>(source?: T | ObservableValue<T>) {
  if (source && isObservable(source)) return () => source.value;
  return () => source;
}
