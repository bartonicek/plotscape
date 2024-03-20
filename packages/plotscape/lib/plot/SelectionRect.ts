import { Emitter, subscribable } from "../mixins/Emitter";
import { Rect } from "../types";
import { Contexts } from "./Plot";

export interface SelectionRect extends Emitter<`changed`> {
  coords: Rect;
  setCoords(coords: Rect): void;
  clear(): void;
  render(contexts: Contexts): void;
}

export function newSelectionRect(): SelectionRect {
  const coords = [0, 0, 0, 0] as Rect;

  const self = subscribable({ coords, setCoords, clear, render });
  return self;
}

function setCoords(this: SelectionRect, coords: Rect) {
  this.coords = coords;
  this.emit(`changed`);
}

function clear(this: SelectionRect) {
  this.setCoords([0, 0, 0, 0]);
}

function render(this: SelectionRect, contexts: Contexts) {
  const [x0, y0, x1, y1] = this.coords;
  contexts.user.clear();
  contexts.user.rectangleXY(x0, y0, x1, y1);
}
