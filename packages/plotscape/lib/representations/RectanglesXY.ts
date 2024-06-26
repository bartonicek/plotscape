import { mergeInto } from "utils";
import { getQueryInformation, pointInRect, rectsIntersect } from "../funs";
import { ContextId, Contexts, Plot, layers } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Point, Rect } from "../types";
import { Variable } from "../variables/Variable";
import {
  Representation,
  remap,
  setBoundaryData,
  setRenderData,
} from "./Representation";

type Encodings = {
  x0: Variable;
  y0: Variable;
  x1: Variable;
  y1: Variable;
  area?: Variable;
};

export interface RectanglesXY extends Representation<Encodings> {}

export function newRectanglesXY(plot: Plot): RectanglesXY {
  const { scales, contexts } = plot;
  const props = { scales, contexts };
  const methods = {
    setBoundaryData,
    setRenderData,
    render,
    check,
    query,
    remap,
  };
  const self = { ...props, ...methods };

  return self;
}

function render(this: RectanglesXY, contexts: Contexts) {
  if (!this.renderData) return;

  const { renderData: data, scales } = this;
  const n = data.n();

  for (const id of layers) contexts[id].clear();

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    let x0 = data.col(`x0`).scaledAt(i, scales.x);
    let y0 = data.col(`y0`).scaledAt(i, scales.y);
    let x1 = data.col(`x1`).scaledAt(i, scales.x);
    let y1 = data.col(`y1`).scaledAt(i, scales.y);

    if (data.col(`area`)) {
      const a = data.col(`area`)!.scaledAt(i, scales.area);

      x0 = x0 + ((1 - a) / 2) * (x1 - x0);
      x1 = x1 - ((1 - a) / 2) * (x1 - x0);
      y0 = y0 + ((1 - a) / 2) * (y1 - y0);
      y1 = y1 - ((1 - a) / 2) * (y1 - y0);
    }

    contexts[layer].rectangleXY(x0, y0, x1, y1);
  }
}

function check(this: RectanglesXY, coords: Rect) {
  if (!this.boundaryData) return new Set<number>();

  const { boundaryData: data, scales } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    let x0 = data.col(`x0`).scaledAt(i, scales.x);
    let y0 = data.col(`y0`).scaledAt(i, scales.y);
    let x1 = data.col(`x1`).scaledAt(i, scales.x);
    let y1 = data.col(`y1`).scaledAt(i, scales.y);

    if (data.col(`area`)) {
      const a = data.col(`area`)!.scaledAt(i, scales.area);

      x0 = x0 + ((1 - a) / 2) * (x1 - x0);
      x1 = x1 - ((1 - a) / 2) * (x1 - x0);
      y0 = y0 + ((1 - a) / 2) * (y1 - y0);
      y1 = y1 - ((1 - a) / 2) * (y1 - y0);
    }

    const selfCoords = [x0, y0, x1, y1] as Rect;

    if (rectsIntersect(coords, selfCoords)) {
      mergeInto(selected, data.col(POSITIONS).valueAt(i));
    }
  }

  return selected;
}

function query(this: RectanglesXY, point: Point) {
  if (!this.boundaryData) return;

  const { boundaryData, renderData, scales } = this;
  const n = boundaryData.n();

  for (let i = 0; i < n; i++) {
    let x0 = boundaryData.col(`x0`).scaledAt(i, scales.x);
    let y0 = boundaryData.col(`y0`).scaledAt(i, scales.y);
    let x1 = boundaryData.col(`x1`).scaledAt(i, scales.x);
    let y1 = boundaryData.col(`y1`).scaledAt(i, scales.y);

    if (boundaryData.col(`area`)) {
      const a = boundaryData.col(`area`)!.scaledAt(i, scales.area);

      x0 = x0 + ((1 - a) / 2) * (x1 - x0);
      x1 = x1 - ((1 - a) / 2) * (x1 - x0);
      y0 = y0 + ((1 - a) / 2) * (y1 - y0);
      y1 = y1 - ((1 - a) / 2) * (y1 - y0);
    }
    const selfCoords = [x0, y0, x1, y1] as Rect;

    if (pointInRect(point, selfCoords)) {
      return getQueryInformation(i, boundaryData, renderData);
    }
  }
  return undefined;
}
