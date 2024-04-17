import { orderByIndices } from "../funs";
import { observable, untrack } from "../mixins/Observable";
import { newDragListWidget } from "../widgets/DragListWidget";
import { Expanse } from "./Expanse";
import { ExpanseDiscreteAbsolute } from "./ExpanseDiscreteAbsolute";

export function link<T extends ExpanseDiscreteAbsolute>(
  this: T,
  other: Expanse
) {
  const expand = this.expand.bind(this);
  const defaultize = this.defaultize.bind(this);

  this.expand = (zero, one) => {
    expand(zero, one);
    other.expand(zero, one);
    return this;
  };

  this.defaultize = (options: Record<string, any>) => {
    defaultize(options);
    other.defaultize(options);
    return this;
  };

  return this;
}

export function setZero<T extends ExpanseDiscreteAbsolute>(
  this: T,
  zero: number,
  options?: { default?: boolean }
) {
  this.zero = zero;
  if (options?.default) this.defaultZero = zero;
  return this;
}

export function setOne<T extends ExpanseDiscreteAbsolute>(
  this: T,
  one: number,
  options?: { default?: boolean }
) {
  this.one = one;
  if (options?.default) this.defaultOne = one;
  return this;
}

export function setZeroOne<T extends ExpanseDiscreteAbsolute>(
  this: T,
  zero: number,
  one: number,
  options?: { default?: boolean }
) {
  untrack(this, () => this.setZero(zero, options).setOne(one, options));
  this.emit();
  return this;
}

export function setValues<T extends ExpanseDiscreteAbsolute>(
  this: T,
  values: string[]
) {
  for (let i = 0; i < values.length; i++) this.values[i] = values[i];
  this.emit();
  return this;
}

export function expand<T extends ExpanseDiscreteAbsolute>(
  this: T,
  zero: number,
  one: number,
  options?: { default?: boolean }
) {
  // Invert such that e.g. [-0.05, 1.05] -> [0.05, 0.95]
  const newRange = (this.one - this.zero) * (1 / (one - zero));
  const newZero = this.zero - zero * newRange;
  const newOne = this.one - (one - 1) * newRange;

  untrack(this, () => {
    this.setZero(newZero, options);
    this.setOne(newOne, options);
  });

  this.emit();
  return this;
}

export function breaks(this: ExpanseDiscreteAbsolute) {
  return orderByIndices(this.values, this.order);
}

export function widget(this: ExpanseDiscreteAbsolute) {
  const { values } = this;

  const source = observable({ values: [...values] });
  const widget = newDragListWidget(source);

  this.listen(() => {
    source.values = orderByIndices(values, this.order);
    source.emit();
  });

  widget.listen(() => {
    const indices = Array(values.length);

    for (let i = 0; i < values.length; i++) {
      indices[i] = source.values.indexOf(values[i]);
    }

    this.setOrder(indices);
  });

  return widget;
}
