import { dec, inc, mapParallel, mergeInto, values } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { orderByIndices, rectSegmentIntersect } from "../funs";
import { ContextId, Contexts, Plot, Scales } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { BoundaryCols, Point, Rect, RenderCols } from "../types";
import { Tuple } from "../variables/Tuple";
import {
  Representation,
  mapEncodingToScale,
  setBoundaryData,
  setRenderData,
} from "./Representation";

type Encodings = {
  x: Tuple;
  y: Tuple;
};

export interface Lines extends Representation {
  boundaryData: Dataframe<Encodings & BoundaryCols>;
  renderData: Dataframe<Encodings & RenderCols>;
  scales: Scales;
  contexts: Contexts;
}

export function newLines(
  plot: Plot,
  boundaryData: Dataframe<Encodings & BoundaryCols>,
  renderData: Dataframe<Encodings & RenderCols>
): Lines {
  const { scales, contexts } = plot;
  const props = { boundaryData, renderData, scales, contexts };
  const methods = {
    render,
    check,
    query,
    setBoundaryData,
    setRenderData,
    mapEncodingToScale,
  };
  const self = { ...props, ...methods };

  return self;
}

function render(this: Lines) {
  const { renderData: data, scales, contexts } = this;
  const n = data.n();
  const order = scales.x.domain.order!;

  if (!order) return;

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    let x = data.col(`x`).scaledAt(i, scales.x);
    let y = data.col(`y`).scaledAt(i, scales.y);
    x = orderByIndices(x, order);
    y = orderByIndices(y, order);

    contexts[layer].line(x, y);
  }
}

function check(this: Lines, coords: Rect) {
  const { boundaryData: data, scales } = this;

  const n = data.n();
  const selected = new Set<number>();
  const order = scales.x.domain.order!;

  if (!order) return selected;

  for (let i = 0; i < n; i++) {
    let x = data.col(`x`).scaledAt(i, scales.x);
    let y = data.col(`y`).scaledAt(i, scales.y);
    x = orderByIndices(x, order);
    y = orderByIndices(y, order);

    for (let j = 1; j < x.length; j++) {
      if (rectSegmentIntersect(coords, [x[j - 1], y[j - 1], x[j], y[j]])) {
        mergeInto(selected, data.col(POSITIONS).valueAt(i));
      }
    }
  }

  return selected;
}

function query(this: Lines, point: Point) {
  const { boundaryData: data, scales } = this;
  const n = data.n();
  const coords = mapParallel(point, dec, inc) as Rect;
  const order = scales.x.domain.order!;

  if (!order) return {};

  for (let i = 0; i < n; i++) {
    let x = data.col(`x`).scaledAt(i, scales.x);
    let y = data.col(`y`).scaledAt(i, scales.y);
    x = orderByIndices(x, order);
    y = orderByIndices(y, order);

    for (let j = 1; j < x.length; j++) {
      if (rectSegmentIntersect(coords, [x[j - 1], y[j - 1], x[j], y[j]])) {
        const result = {} as Record<string, any>;

        for (const v of values(data.cols())) {
          if (v && v.hasName() && !(v.name() in result)) {
            result[v.name()] = v.valueAt(i);
          }
        }

        return result;
      }
    }
  }
}
