import { mergeInto, values } from "utils";
import { pointInRect, rectsIntersect } from "../funs";
import { ContextId, Contexts, Plot, layers } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Point, Rect } from "../types";
import { Variable } from "../variables/Variable";
import {
  Representation,
  mapEncodingToScale,
  setBoundaryData,
  setRenderData,
} from "./Representation";

type Encodings = {
  x0: Variable;
  y0: Variable;
  x1: Variable;
  y1: Variable;
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
    mapEncodingToScale,
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

    const x0 = data.col(`x0`).scaledAt(i, scales.x);
    const y0 = data.col(`y0`).scaledAt(i, scales.y);
    const x1 = data.col(`x1`).scaledAt(i, scales.x);
    const y1 = data.col(`y1`).scaledAt(i, scales.y);

    contexts[layer].rectangleXY(x0, y0, x1, y1);
  }
}

function check(this: RectanglesXY, coords: Rect) {
  if (!this.boundaryData) return new Set<number>();

  const { boundaryData: data, scales } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x0 = data.col(`x0`).scaledAt(i, scales.x);
    const y0 = data.col(`y0`).scaledAt(i, scales.y);
    const x1 = data.col(`x1`).scaledAt(i, scales.x);
    const y1 = data.col(`y1`).scaledAt(i, scales.y);

    const selfCoords = [x0, y0, x1, y1] as Rect;

    if (rectsIntersect(coords, selfCoords)) {
      mergeInto(selected, data.col(POSITIONS).valueAt(i));
    }
  }

  return selected;
}

function query(this: RectanglesXY, point: Point) {
  if (!this.boundaryData) return;

  const { boundaryData: data, scales } = this;
  const n = data.n();

  for (let i = 0; i < n; i++) {
    const x0 = data.col(`x0`).scaledAt(i, scales.x);
    const y0 = data.col(`y0`).scaledAt(i, scales.y);
    const x1 = data.col(`x1`).scaledAt(i, scales.x);
    const y1 = data.col(`y1`).scaledAt(i, scales.y);

    const selfCoords = [x0, y0, x1, y1] as Rect;

    if (pointInRect(point, selfCoords)) {
      const result = {} as Record<string, any>;

      for (const v of values(data.cols())) {
        if (v && v.hasName() && !(v.name() in result)) {
          result[v.name()] = v.valueAt(i);
        }
      }

      return result;
    }
  }
  return undefined;
}
