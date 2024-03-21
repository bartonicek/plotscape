import { mergeSetIntoAnother } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { pointInRect, rectsIntersect } from "../funs";
import { ContextId, Contexts, Plot, Scales } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Point, Rect } from "../types";
import { Reference } from "../variables/Reference";
import { Representation } from "./Representation";

type Encodings = {
  x0: any;
  y0: any;
  x1: any;
  y1: any;
};

export interface RectanglesWH extends Representation {
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>;
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>;
  scales: Scales;
}

export function newRectanglesXY(
  plot: Plot,
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>,
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>
): RectanglesWH {
  const { scales } = plot;
  const props = { boundaryData, renderData, scales };
  const methods = { render, check, query };
  const self = { ...props, ...methods };

  return self;
}

function render(this: RectanglesWH, contexts: Contexts) {
  const { renderData: data, scales } = this;
  const n = data.n();

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    const x0 = data.col(`x0`).scaledAt(i, scales.x);
    const y0 = data.col(`y0`).scaledAt(i, scales.y);
    const x1 = data.col(`x1`).scaledAt(i, scales.x);
    const y1 = data.col(`y1`).scaledAt(i, scales.y);

    contexts[layer].rectangleXY(x0, y0, x1, y1);
  }
}

function check(this: RectanglesWH, coords: Rect) {
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
      mergeSetIntoAnother(selected, data.col(POSITIONS).valueAt(i));
    }
  }

  return selected;
}

function query(this: RectanglesWH, point: Point) {
  const { boundaryData: data, scales } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x0 = data.col(`x0`).scaledAt(i, scales.x);
    const y0 = data.col(`y0`).scaledAt(i, scales.y);
    const x1 = data.col(`x1`).scaledAt(i, scales.x);
    const y1 = data.col(`y1`).scaledAt(i, scales.y);

    const selfCoords = [x0, y0, x1, y1] as Rect;

    if (pointInRect(point, selfCoords)) {
      const result = {} as Record<string, any>;
      // TODO
    }
  }
  return undefined;
}
