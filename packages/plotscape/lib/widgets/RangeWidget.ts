import { clearChildren, element } from "utils";
import { formatLabel } from "../funs";
import { named } from "../mixins/Named";
import { Observable, observable } from "../mixins/Observable";
import { Widget } from "./Widget";

type Source = { min: number; max: number } & Observable;

export interface RangeWidget extends Widget {
  source: Source;
  min: number;
  max: number;
}

export function newRangeWidget(source: Source): RangeWidget {
  const container = element(`div`)
    .addClass(`ps-widget`)
    .addClass(`ps-widget-range`)
    .get();

  const { min, max } = source;
  const self = observable(named({ container, source, min, max, render }));

  source.listen(self.render.bind(self));
  return self;
}

function render(this: RangeWidget) {
  const { container, source } = this;

  clearChildren(container);

  const name = element(`span`).appendTo(container).get();
  const inputMin = element(`input`).appendTo(container).get();
  const inputMax = element(`input`).appendTo(container).get();

  name.innerText = `Range of ${this.name()}: `;
  inputMin.size = 6;
  inputMax.size = 6;

  inputMin.onmousedown = (event) => event.stopPropagation();
  inputMax.onmousedown = (event) => event.stopPropagation();

  inputMin.value = formatLabel(source.min);
  inputMax.value = formatLabel(source.max);

  const update = (event: KeyboardEvent) => {
    if (!(event.code === `Enter`)) return;
    this.min = parseFloat(inputMin.value);
    this.max = parseFloat(inputMax.value);
    this.emit();
  };

  inputMin.addEventListener(`keydown`, update);
  inputMax.addEventListener(`keydown`, update);
  return this;
}
