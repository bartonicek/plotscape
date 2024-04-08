import { clearChildren, element } from "utils";
import { formatLabel } from "../funs";
import { named } from "../mixins/Named";
import { Observable, observable } from "../mixins/Observable";
import { Widget } from "./Widget";

type Value = number;
type Source<T extends number> = { value: T } & Observable;

export interface ValueWidget<T extends Value> extends Widget {
  value: T;
  source: Source<T>;
}

export function newValueWidget<T extends Value>(
  source: Source<T>
): ValueWidget<T> {
  const container = element(`div`).addClass(`ps-widget`).get();
  const value = source.value;

  const self = observable(named({ source, value, container, render }));
  source.listen(self.render.bind(self));

  return self;
}

function render<T extends Value>(this: ValueWidget<T>) {
  const { container, source } = this;

  clearChildren(container);

  const name = element(`span`).appendTo(container).get();
  const input = element(`input`).appendTo(container).get();

  name.innerText = `${this.name()}`;
  input.value = `${formatLabel(source.value)}`;
  input.size = 6;

  input.addEventListener(`keydown`, (event) => {
    if (event.code != `Enter`) return;
    this.value = parseFloat(input.value) as T;
    this.emit();
  });

  input.onmousedown = (event) => event.stopPropagation();

  return this;
}
