import { mergeSetIntoAnother } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { pointInRect, rectsIntersect } from "../funs";
import { ContextId, Contexts, Plot, Scales } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { HorizontalAnchor, Point, Rect, VerticalAnchor } from "../types";
import { Reference } from "../variables/Reference";
import { Representation, mapEncodingToScale } from "./Representation";

type Encodings = {
  x: any;
  y: any;
  width: any;
  height: any;
};

export interface RectanglesWH extends Representation {
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>;
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>;
  scales: Scales;

  hAnchor: HorizontalAnchor;
  vAnchor: VerticalAnchor;

  setHAnchor(anchor: HorizontalAnchor): this;
  setVAnchor(anchor: VerticalAnchor): this;
}

export function newRectanglesWH(
  plot: Plot,
  boundaryData: Dataframe<Encodings & { [POSITIONS]: Reference<Set<number>> }>,
  renderData: Dataframe<Encodings & { [LAYER]: Reference<ContextId> }>
): RectanglesWH {
  const scales = { ...plot.scales };
  const [hAnchor, vAnchor] = [HorizontalAnchor.Center, VerticalAnchor.Middle];

  const pars = { hAnchor, vAnchor };
  const props = { boundaryData, renderData, scales };
  const methods = {
    render,
    check,
    query,
    setHAnchor,
    setVAnchor,
    mapEncodingToScale,
  };
  const self = { ...pars, ...props, ...methods };

  return self;
}

function render(this: RectanglesWH, contexts: Contexts) {
  const { renderData: data, scales, hAnchor, vAnchor } = this;
  const n = data.n();

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    const w = data.col(`width`).scaledAt(i, scales.width);
    const h = data.col(`height`).scaledAt(i, scales.height);

    contexts[layer].rectangleWH(x, y, w, h, { vAnchor, hAnchor });
  }
}

function check(this: RectanglesWH, coords: Rect) {
  const { boundaryData: data, scales, vAnchor, hAnchor } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    const w = data.col(`width`).scaledAt(i, scales.width);
    const h = data.col(`height`).scaledAt(i, scales.height);

    const selfCoords = [
      x - w * hAnchor,
      y - vAnchor * h,
      x + w * hAnchor,
      y + (1 - vAnchor) * h,
    ] as Rect;

    if (rectsIntersect(coords, selfCoords)) {
      mergeSetIntoAnother(selected, data.col(POSITIONS).valueAt(i));
    }
  }

  return selected;
}

function query(this: RectanglesWH, point: Point) {
  const { boundaryData: data, scales, vAnchor, hAnchor } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    const w = data.col(`width`).scaledAt(i, scales.width);
    const h = data.col(`height`).scaledAt(i, scales.height);

    const selfCoords = [
      x - w * hAnchor,
      y - vAnchor * h,
      x + w * hAnchor,
      y + (1 - vAnchor) * h,
    ] as Rect;

    if (pointInRect(point, selfCoords)) {
      const result = {} as Record<string, any>;
      if (data.col(`x`).name()) {
        result[data.col("x").name()] = data.col("x").valueAt(i);
      }
      if (data.col(`y`).name()) {
        result[data.col("y").name()] = data.col("y").valueAt(i);
      }
    }
  }

  return selected;
}

function setHAnchor(this: RectanglesWH, anchor: HorizontalAnchor) {
  this.hAnchor = anchor;
  return this;
}

function setVAnchor(this: RectanglesWH, anchor: VerticalAnchor) {
  this.vAnchor = anchor;
  return this;
}
