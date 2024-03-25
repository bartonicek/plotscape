import { element } from "utils";
import { Emitter, subscribable } from "./mixins/Emitter";

interface DragList extends Emitter<`changed`> {
  container: HTMLDivElement;
  values: string[];
}

export function newDragList(values: string[]): DragList {
  const container = element(`div`).get();
  const list = element(`ul`).addClass(`ps-draglist`).appendTo(container).get();
  const self = subscribable({ container, values });

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
