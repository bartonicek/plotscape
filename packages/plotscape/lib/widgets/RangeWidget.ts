import { clearChildren, element, flipEnum } from "utils";
import { formatLabel } from "../funs";
import { named } from "../mixins/Named";
import { Observable, observable } from "../mixins/Observable";
import { Direction } from "../types";
import { Widget } from "./Widget";

type Source = { min: number; max: number } & Observable;

export interface RangeWidget extends Widget {
  source: Source;
  min: number;
  max: number;
  direction: Direction;
}

export function newRangeWidget(source: Source): RangeWidget {
  const container = element(`div`)
    .addClass(`ps-widget`)
    .addClass(`ps-widget-range`)
    .get();

  const { min, max } = source;
  const direction = Direction.Forward;
  const self = observable(
    named({ container, source, min, max, direction, render })
  );

  source.listen(self.render.bind(self));
  return self;
}

function render(this: RangeWidget) {
  const { container, source } = this;

  clearChildren(container);

  const wrapper = element(`span`).appendTo(container).get();
  const name = element(`span`).appendTo(wrapper).get();
  const inputMin = element(`input`).appendTo(wrapper).get();
  const inputMax = element(`input`).appendTo(wrapper).get();
  const flipButton = element(`button`).text(`⇆`).appendTo(wrapper).get();

  name.innerText = `Range of ${this.name()}: `;
  inputMin.size = 6;
  inputMax.size = 6;

  inputMin.onmousedown = (event) => event.stopPropagation();
  inputMax.onmousedown = (event) => event.stopPropagation();

  inputMin.value = formatLabel(source.min);
  inputMax.value = formatLabel(source.max);

  const updateValue = (event: KeyboardEvent) => {
    if (!(event.code === `Enter`)) return;
    this.min = parseFloat(inputMin.value);
    this.max = parseFloat(inputMax.value);
    this.emit();
  };

  inputMin.addEventListener(`keydown`, updateValue);
  inputMax.addEventListener(`keydown`, updateValue);
  flipButton.addEventListener(`mousedown`, () => {
    this.direction = flipEnum(this.direction);
    this.emit();
  });

  return this;
}
