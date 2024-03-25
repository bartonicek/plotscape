import { element } from "utils";
import { Emitter, subscribable } from "../mixins/Emitter";
import { Widget } from "./Widget";

export interface RangeWidget extends Widget, Emitter<`changed`> {
  name: HTMLSpanElement;
  container: HTMLDivElement;
  min: number;
  max: number;
  source: { min: number; max: number };
  inputs: { min: HTMLInputElement; max: HTMLInputElement };
  render(): void;
  setName(name: string): this;
}

export function newRangeWidget(source: {
  min: number;
  max: number;
}): RangeWidget {
  const container = element(`div`)
    .addClass(`ps-widget`)
    .addClass(`ps-widget-range`)
    .get();

  const _name = element(`span`).appendTo(container).get();
  const inputMin = element(`input`).appendTo(container).get();
  const inputMax = element(`input`).appendTo(container).get();
  const { min, max } = source;
  inputMin.size = 6;
  inputMax.size = 6;

  const inputs = { min: inputMin, max: inputMax };

  const props = { container, name: _name, source, inputs, min, max };
  const methods = { setName, render };
  const self = subscribable({ ...props, ...methods });

  inputMin.addEventListener(`keydown`, (event) => {
    if (!(event.code === `Enter`)) return;
    self.min = parseFloat(inputMin.value);
    self.render();
    self.emit(`changed`);
  });

  inputMax.addEventListener(`keydown`, (event) => {
    if (!(event.code === `Enter`)) return;
    self.max = parseFloat(inputMax.value);
    self.render();
    self.emit(`changed`);
  });

  self.render();
  return self;
}

function setName(this: RangeWidget, name: string) {
  this.name.innerText = `Range of ${name}:`;
  return this;
}

function render(this: RangeWidget) {
  this.inputs.min.value = this.min.toString();
  this.inputs.max.value = this.max.toString();
}
