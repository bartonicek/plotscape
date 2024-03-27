import { compareAlphaNumeric, seq } from "utils";
import { Emitter, subscribable } from "../mixins/Emitter";
import { DragListWidget, newDragListWidget } from "../widgets/DragListWidget";
import { Expanse } from "./Expanse";

export interface ExpanseDiscreteAbsolute
  extends Expanse<string>,
    Emitter<"changed"> {
  order: number[];
  values: string[];
  setOrder(indices: number[]): this;
  setValues(values: string[]): this;
  setDefaultOrder(): this;
  retrain(array: string[]): this;
  clone(): ExpanseDiscreteAbsolute;

  widget(): DragListWidget;
}

export function newExpanseDiscreteAbsolute(
  values: string[]
): ExpanseDiscreteAbsolute {
  const order = seq(0, values.length - 1);

  const props = { order, values };
  const methods = {
    clone,
    normalize,
    unnormalize,
    setValues,
    setOrder,
    setDefaultOrder,
    retrain,
    breaks,
    widget,
  };

  const self = subscribable({ ...props, ...methods });

  return self;
}

function normalize(this: ExpanseDiscreteAbsolute, value: string) {
  const { order, values } = this;
  return order[values.indexOf(value)] / (values.length - 1);
}

function unnormalize(this: ExpanseDiscreteAbsolute, value: number) {
  throw new Error(`Not implemented yet`);
  return this.values[0];
}

function setValues(this: ExpanseDiscreteAbsolute, values: string[]) {
  for (let i = 0; i < values.length; i++) this.values[i] = values[i];
  this.emit(`changed`);
  return this;
}

function setOrder(this: ExpanseDiscreteAbsolute, indices: number[]) {
  for (let i = 0; i < indices.length; i++) this.order[i] = indices[i];
  this.emit(`changed`);
  return this;
}

function setDefaultOrder(this: ExpanseDiscreteAbsolute) {
  for (let i = 0; i < this.order.length; i++) this.order[i] = i;
  this.emit(`changed`);
  return this;
}

function retrain(this: ExpanseDiscreteAbsolute, array: string[]) {
  const values = Array.from(new Set(array)).sort(compareAlphaNumeric);
  this.values = values;
  this.emit(`changed`);

  return this;
}

function clone(this: ExpanseDiscreteAbsolute) {
  const copy = newExpanseDiscreteAbsolute(this.values);
  copy.order = this.order;
  copy.normalize = this.normalize;
  return copy;
}

function breaks(this: ExpanseDiscreteAbsolute) {
  return this.values;
}

function widget(this: ExpanseDiscreteAbsolute) {
  const { values } = this;
  const source = { values: [...values] };

  const widget = newDragListWidget(source);

  widget.listen(`changed`, () => {
    const indices = Array(values.length);

    for (let i = 0; i < values.length; i++) {
      indices[i] = source.values.indexOf(values[i]);
    }

    this.setOrder(indices);
  });

  return widget;
}
