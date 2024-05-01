import { mergeInto } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { getQueryInformation, pointInRect, rectsIntersect } from "../funs";
import { graphicParameters } from "../graphicParameters";
import { ObservableValue, newObservableValue } from "../mixins/ObservableValue";
import { ContextId, Contexts, Plot, Scales, layers } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { BoundaryCols, KeyActions, Point, Rect, RenderCols } from "../types";
import { Variable } from "../variables/Variable";
import {
  Representation,
  remap,
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
  contexts: Contexts;
  sizePct: ObservableValue<number>;
}

export function newPoints(
  plot: Plot,
  boundaryData: Dataframe<Encodings & BoundaryCols>,
  renderData: Dataframe<Encodings & RenderCols>
): Points {
  const { scales, contexts } = plot;
  const sizePct = newObservableValue(1);
  const keyActions = {} as KeyActions;

  keyActions[`Equal`] = () => sizePct.set((v) => (v * 10) / 9);
  keyActions[`Minus`] = () => sizePct.set((v) => (v * 9) / 10);
  keyActions[`KeyR`] = () => sizePct.defaultize();

  const props = {
    boundaryData,
    renderData,
    scales,
    contexts,
    keyActions,
    sizePct,
  };
  const methods = {
    render,
    check,
    query,
    setBoundaryData,
    setRenderData,
    remap,
  };
  const self = { ...props, ...methods };
  sizePct.listen(self.render.bind(self));
  return self;
}

function render(this: Points) {
  const { renderData: data, scales, contexts, sizePct } = this;
  const n = data.n();

  for (const id of layers) contexts[id].clear();

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let radius = data.col(`size`)?.scaledAt(i, scales.size);
    radius = radius ?? graphicParameters.defaultRadius;
    radius = radius * sizePct.value;

    contexts[layer].point(x, y, { radius });
  }
}

function check(this: Points, coords: Rect) {
  const { boundaryData: data, scales, sizePct } = this;

  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let radius = data.col(`size`)?.scaledAt(i, scales.size);
    radius = radius ?? graphicParameters.defaultRadius;
    radius = radius * sizePct.value;
    const c = radius / Math.sqrt(2);

    if (rectsIntersect(coords, [x - c, y - c, x + c, y + c])) {
      mergeInto(selected, data.col(POSITIONS).valueAt(i));
    }
  }

  return selected;
}

function query(this: Points, point: Point) {
  const { boundaryData, renderData, scales, sizePct } = this;

  const n = boundaryData.n();

  for (let i = 0; i < n; i++) {
    const x = boundaryData.col(`x`).scaledAt(i, scales.x);
    const y = boundaryData.col(`y`).scaledAt(i, scales.y);
    let radius = boundaryData.col(`size`)?.scaledAt(i, scales.size);
    radius = radius ?? graphicParameters.defaultRadius;
    radius = radius * sizePct.value;
    const c = radius / Math.sqrt(2);

    if (pointInRect(point, [x - c, y - c, x + c, y + c])) {
      return getQueryInformation(i, boundaryData, renderData);
    }
  }

  return undefined;
}
