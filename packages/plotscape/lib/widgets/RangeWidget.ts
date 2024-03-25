import { element } from "utils";
import { formatLabel } from "../funs";
import { Emitter, subscribable } from "../mixins/Emitter";
import { Widget } from "./Widget";

type Source = { min: number; max: number } & Emitter<`changed`>;

export interface RangeWidget extends Widget, Emitter<`changed`> {
  name: HTMLSpanElement;
  container: HTMLDivElement;
  source: { min: number; max: number } & Emitter<`changed`>;
  inputs: { min: HTMLInputElement; max: HTMLInputElement };
  min(): number;
  max(): number;
  render(): void;
  setName(name: string): this;
}

export function newRangeWidget(source: Source): RangeWidget {
  const container = element(`div`)
    .addClass(`ps-widget`)
    .addClass(`ps-widget-range`)
    .get();

  const _name = element(`span`).appendTo(container).get();
  const inputMin = element(`input`).appendTo(container).get();
  const inputMax = element(`input`).appendTo(container).get();
  inputMin.size = 6;
  inputMax.size = 6;

  const inputs = { min: inputMin, max: inputMax };

  const props = { container, name: _name, source, inputs };
  const methods = { setName, render, min, max };
  const self = subscribable({ ...props, ...methods });

  inputMin.addEventListener(`keydown`, (event) => {
    if (!(event.code === `Enter`)) return;
    self.emit(`changed`);
    self.render();
  });

  inputMax.addEventListener(`keydown`, (event) => {
    if (!(event.code === `Enter`)) return;
    self.emit(`changed`);
    self.render();
  });

  self.render();
  return self;
}

function setName(this: RangeWidget, name: string) {
  this.name.innerText = `Range of ${name}:`;
  return this;
}

function render(this: RangeWidget) {
  this.inputs.min.value = formatLabel(this.source.min);
  this.inputs.max.value = formatLabel(this.source.max);
}

function min(this: RangeWidget) {
  return parseFloat(this.inputs.min.value);
}

function max(this: RangeWidget) {
  return parseFloat(this.inputs.max.value);
}
