import { mergeInto, values } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { pointInRect, rectsIntersect } from "../funs";
import graphicParameters from "../graphicParameters.json";
import { ContextId, Contexts, Plot, Scales } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { BoundaryCols, Point, Rect, RenderCols } from "../types";
import { Variable } from "../variables/Variable";
import {
  Representation,
  mapEncodingToScale,
  setBoundaryData,
  setRenderData,
} from "./Representation";

type Encodings = {
  x: Variable;
  y: Variable;
  size?: Variable;
};

export interface Points extends Representation {
  boundaryData: Dataframe<Encodings & BoundaryCols>;
  renderData: Dataframe<Encodings & RenderCols>;
  scales: Scales;

  sizePct: number;
}

export function newPoints(
  plot: Plot,
  boundaryData: Dataframe<Encodings & BoundaryCols>,
  renderData: Dataframe<Encodings & RenderCols>
): Points {
  const scales = plot.scales;
  const sizePct = 1;
  const props = { boundaryData, renderData, scales, sizePct };
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
