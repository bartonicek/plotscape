import { mergeInto, values } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { pointInRect, rectsIntersect } from "../funs";
import graphicParameters from "../graphicParameters.json";
import { ContextId, Contexts, Plot, Scales } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Point, Rect } from "../types";
import { Reference } from "../variables/Reference";
import {
  Representation,
  mapEncodingToScale,
  setBoundaryData,
  setRenderData,
} from "./Representation";

type Encodings = {
  x: any;
  y: any;
  size?: any;
};

export interface Points extends Representation {
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>;
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>;
  scales: Scales;

  sizePct: number;
}

export function newPoints(
  plot: Plot,
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>,
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>
): Points {
  const scales = plot.scales;
  const sizePct = 1;
  const props = { boundaryData, renderData, scales, sizePct };
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

function render(this: Points, contexts: Contexts) {
  const { renderData: data, scales } = this;
  const n = data.n();

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let radius = data.col(`size`)?.scaledAt(i, scales.size);
    radius = radius ? Math.sqrt(radius) : graphicParameters.defaultRadius;

    contexts[layer].point(x, y, { radius });
  }
}

function check(this: Points, coords: Rect) {
  const { boundaryData: data, scales } = this;

  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let radius = data.col(`size`)?.scaledAt(i, scales.size);
    radius = radius ? Math.sqrt(radius) : graphicParameters.defaultRadius;
    const c = radius / Math.sqrt(2);

    if (rectsIntersect(coords, [x - c, y - c, x + c, y + c])) {
      mergeInto(selected, data.col(POSITIONS).valueAt(i));
    }
  }

  return selected;
}

function query(this: Points, point: Point) {
  const { boundaryData: data, scales } = this;

  const n = data.n();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let radius = data.col(`size`)?.scaledAt(i, scales.size);
    radius = radius ? Math.sqrt(radius) : graphicParameters.defaultRadius;
    const c = radius / Math.sqrt(2);

    if (pointInRect(point, [x - c, y - c, x + c, y + c])) {
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
