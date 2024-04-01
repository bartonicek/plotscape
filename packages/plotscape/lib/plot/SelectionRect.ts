import { Observable, observable } from "../mixins/Observable";
import { Rect } from "../types";
import { Contexts } from "./Plot";

/** Takes care of keeping track of and rendering the selection rectangle. */
export interface SelectionRect extends Observable {
  coords: Rect;
  clear(): void;
  render(contexts: Contexts): void;
  setCoords(coords: Rect): void;
}

export function newSelectionRect(): SelectionRect {
  const coords = [0, 0, 0, 0] as Rect;

  const self = observable({ coords, setCoords, clear, render });
  return self;
}

function setCoords(this: SelectionRect, coords: Rect) {
  this.coords = coords;
  this.emit();
}

function clear(this: SelectionRect) {
  this.setCoords([0, 0, 0, 0]);
}

function render(this: SelectionRect, contexts: Contexts) {
  const [x0, y0, x1, y1] = this.coords;
  contexts.user.clear();
  contexts.user.rectangleXY(x0, y0, x1, y1);
}
