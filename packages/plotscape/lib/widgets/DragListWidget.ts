import { element } from "utils";
import { Emitter, subscribable } from "../mixins/Emitter";
import { Widget } from "./Widget";

export interface DragListWidget extends Widget, Emitter<`changed`> {
  name: string;
  container: HTMLDivElement;
  source: { values: string[] };
  render(): void;
  setName(name: string): this;
}

export function newDragListWidget(source: {
  values: string[];
}): DragListWidget {
  const container = element(`div`)
    .addClass(`ps-widget`)
    .addClass(`ps-widget-draglist`)
    .get();

  const name = ``;
  const props = { name, container, source };
  const methods = { setName, render };

  const self = subscribable({ ...props, ...methods });
  self.render();

  return self;
}

function setName(this: DragListWidget, name: string) {
  this.name = name;
  this.render();
  return this;
}

function render(this: DragListWidget) {
  const { container, source } = this;
  const values = source.values;

  while (container.lastChild) container.removeChild(container.lastChild);

  const name = element(`span`).appendTo(container).get();
  const list = element(`ul`).appendTo(container).get();

  name.innerText = `Levels of ${this.name}: `;

  for (const v of values) {
    const li = element(`li`)
      .setAttribute(`draggable`, true)
      .text(v)
      .appendTo(list)
      .get();

    li.addEventListener("dragstart", () => li.classList.add(`dragged`));
    li.addEventListener("dragend", () => {
      const children = Array.from(list.childNodes) as HTMLElement[];
      for (let i = 0; i < children.length; i++) {
        values[i] = children[i].innerText;
      }
      this.emit(`changed`);
      li.classList.remove(`dragged`);
    });
  }

  list.addEventListener(`mousedown`, (event) => event.stopPropagation());
  list.addEventListener(`dragover`, (event) => swapAt(list, event.clientY));
}

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
