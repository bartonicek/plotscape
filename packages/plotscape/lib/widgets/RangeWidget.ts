import { element } from "utils";
import { formatLabel } from "../funs";
import { Observable, observable } from "../mixins/Observable";
import { Widget } from "./Widget";

type Source = { min: number; max: number } & Observable;

export interface RangeWidget extends Widget, Observable {
  name: string;
  source: { min: number; max: number } & Observable;
  min: number;
  max: number;
  render(): void;
  setName(name: string): this;
}

export function newRangeWidget(source: Source): RangeWidget {
  const container = element(`div`)
    .addClass(`ps-widget`)
    .addClass(`ps-widget-range`)
    .get();

  const name = ``;
  const { min, max } = source;

  const props = { container, name, source, min, max };
  const methods = { setName, render, min, max };
  const self = observable({ ...props, ...methods });

  self.render();
  return self;
}

function setName(this: RangeWidget, name: string) {
  this.name = name;
  this.render();
  return this;
}

function render(this: RangeWidget) {
  const { container, source } = this;

  while (container.lastChild) container.removeChild(container.lastChild);

  const name = element(`span`).appendTo(container).get();
  const inputMin = element(`input`).appendTo(container).get();
  const inputMax = element(`input`).appendTo(container).get();

  name.innerText = `Range of ${this.name}: `;
  inputMin.size = 6;
  inputMax.size = 6;

  inputMin.value = formatLabel(source.min);
  inputMax.value = formatLabel(source.max);

  const update = (event: KeyboardEvent) => {
    if (!(event.code === `Enter`)) return;
    this.min = parseFloat(inputMin.value);
    this.max = parseFloat(inputMax.value);
    this.emit();
    this.render();
  };

  inputMin.addEventListener(`keydown`, update);
  inputMax.addEventListener(`keydown`, update);
}
