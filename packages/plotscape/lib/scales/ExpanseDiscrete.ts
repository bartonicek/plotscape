import { orderByIndices } from "../funs";
import { observable } from "../mixins/Observable";
import { DragListWidget, newDragListWidget } from "../widgets/DragListWidget";
import { Expanse } from "./Expanse";

// ExpanseDiscrete is just an abstract interface, like
// Expanse. It is implemented by ExpanseDiscreteAbsolute
// and ExpanseDiscreteWeighted
export interface ExpanseDiscrete extends Expanse<string> {
  order: number[];
  values: string[];

  clone(): this;
  normalize(value: string): number;
  unnormalize(value: number): string;
  defaultize(options?: {
    zero?: boolean;
    one?: boolean;
    order?: boolean;
  }): this;

  setValues(values: string[]): this;
  setOrder(indices: number[]): this;
  setDefaultOrder(): this;

  retrain(array: string[]): this;
  breaks(): string[];
  widget(): DragListWidget;
}

export function setValues<T extends ExpanseDiscrete>(
  this: T,
  values: string[]
) {
  for (let i = 0; i < values.length; i++) this.values[i] = values[i];
  this.emit();
  return this;
}

export function breaks(this: ExpanseDiscrete) {
  return orderByIndices(this.values, this.order);
}

export function widget(this: ExpanseDiscrete) {
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
