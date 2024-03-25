import { element } from "utils";
import { Emitter, subscribable } from "../mixins/Emitter";
import { Widget } from "./Widget";

export interface DragListWidget extends Widget, Emitter<`changed`> {
  name: HTMLSpanElement;
  container: HTMLDivElement;
  values: string[];
  render(): void;
  setName(name: string): this;
}

export function newDragListWidget(values: string[]): DragListWidget {
  const container = element(`div`)
    .addClass(`ps-widget`)
    .addClass(`ps-widget-draglist`)
    .get();

  const _name = element(`span`).appendTo(container).get();
  const list = element(`ul`).appendTo(container).get();

  const props = { name: _name, container, values };
  const methods = { setName, render };

  const self = subscribable({ ...props, ...methods });

  for (const v of values) {
    const li = element(`li`)
      .setAttribute(`draggable`, true)
      .text(v)
      .appendTo(list)
      .get();

    li.addEventListener("dragstart", () => li.classList.add(`dragged`));
    li.addEventListener("dragend", () => li.classList.remove(`dragged`));
  }

  list.addEventListener(`dragover`, (event) => {
    swapAt(list, event.clientY);
    const children = Array.from(list.childNodes) as HTMLElement[];
    const newValues = children.map((x) => x.innerText);
    for (let i = 0; i < newValues.length; i++) values[i] = newValues[i];
    self.emit(`changed`);
  });

  return self;
}

function setName(this: DragListWidget, name: string) {
  this.name.innerText = `Levels of ${name}`;
  return this;
}

function render(this: DragListWidget) {}

function swapAt(container: HTMLElement, y: number) {
  const children = Array.from(container.childNodes) as (Node & Element)[];

  const index = children.findIndex((e) => e.classList.contains(`dragged`));
  const dragged = children.splice(index, 1);

  let closest = { element: children[0], distance: Infinity };

  for (const child of children) {
    const box = child.getBoundingClientRect();
    const distance = y - box.top - box.height / 2;

    if (Math.abs(distance) < closest.distance) {
      closest = { element: child, distance: distance };
    }
  }

  if (closest.distance > 0) container.insertBefore(closest.element, dragged[0]);
  else container.insertBefore(dragged[0], closest.element);
}
