import { invertRange, last } from "utils";
import graphicParameters from "../graphicParameters.json";
import { Rect } from "../types";

type StretchTuple = [height: number, width: number, area: number];

/** Handles nested zooms and unzooms. */
export interface ZoomStack {
  coords: Rect[];
  clear(): this;
  push(coords: Rect): this;
  pop(): Rect;
  isEmpty(): boolean;

  current(): Rect;
  currentStretch(): StretchTuple;
}

export function newZoomStack(): ZoomStack {
  const { defaultNormX: dnx, defaultNormY: dny } = graphicParameters;
  const coords = [[dnx, dny, 1 - dnx, 1 - dny] as Rect];

  const props = { coords };
  const methods = { push, pop, clear, isEmpty, current, currentStretch };
  const self = { ...props, ...methods };

  return self;
}

function push(this: ZoomStack, coords: Rect) {
  const [ix0, ix1] = invertRange(coords[0], coords[2]);
  const [iy0, iy1] = invertRange(coords[1], coords[3]);
  this.coords.push([ix0, iy0, ix1, iy1]);

  return this;
}

function clear(this: ZoomStack) {
  this.coords.length = 1;
  return this;
}

function isEmpty(this: ZoomStack) {
  return this.coords.length === 1;
}

function pop(this: ZoomStack) {
  if (this.coords.length > 1) this.coords.pop();
  return last(this.coords);
}

function current(this: ZoomStack) {
  return last(this.coords);
}

function currentStretch(this: ZoomStack) {
  if (this.coords.length === 1) return [1, 1, 1] as StretchTuple;

  const [ix0, iy0, ix1, iy1] = last(this.coords);

  const widthStretch = ix1 - ix0;
  const heightStretch = iy1 - iy0;
  const areaStretch = Math.max(widthStretch, heightStretch);

  const result = [widthStretch, heightStretch, areaStretch] as StretchTuple;
  return result;
}
