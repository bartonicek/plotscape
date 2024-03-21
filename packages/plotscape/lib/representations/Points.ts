import { mergeSetIntoAnother } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { pointInRect, rectsIntersect } from "../funs";
import graphicParameters from "../graphicParameters.json";
import { ContextId, Contexts, Plot, Scales } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Point, Rect } from "../types";
import { Reference } from "../variables/Reference";
import { Representation } from "./Representation";

type Encodings = {
  x: any;
  y: any;
  size?: any;
};

export interface Points extends Representation {
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>;
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>;
  scales: Scales;
}

export function newPoints(
  plot: Plot,
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>,
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>
): Points {
  const props = { boundaryData, renderData, scales: plot.scales };
  const methods = { render, check, query };
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
      mergeSetIntoAnother(selected, data.col(POSITIONS).valueAt(i));
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
      result[data.col("x").name()] = data.col("x").valueAt(i);
      result[data.col("y").name()] = data.col("y").valueAt(i);
      //   // for (const q of data.queryables) result[q.name()] = q.valueAt(i);
      return result;
    }
  }

  return undefined;
}
