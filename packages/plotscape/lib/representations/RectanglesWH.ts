import { mergeInto } from "utils";
import {
  GapDimension,
  GapHandler,
  GapType,
  newGapHandler,
} from "../GapHandler";
import { getQueryInformation, pointInRect, rectsIntersect } from "../funs";
import { ContextId, Plot, layers } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import {
  HorizontalAnchor,
  KeyActions,
  Point,
  Rect,
  VerticalAnchor,
} from "../types";
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
  width: Variable;
  height: Variable;
};

export interface RectanglesWH extends Representation<Encodings> {
  hAnchor: HorizontalAnchor;
  vAnchor: VerticalAnchor;
  gapHandler: GapHandler;
  setHAnchor(anchor: HorizontalAnchor): this;
  setVAnchor(anchor: VerticalAnchor): this;
  setGapType(type: GapType): this;
  setGapDimension(dimension: GapDimension): this;
  setDefaultGap(pct: number, px: number): this;
  noGap(): this;
}

export function newRectanglesWH(plot: Plot): RectanglesWH {
  const { scales, contexts } = plot;
  const [hAnchor, vAnchor] = [HorizontalAnchor.Center, VerticalAnchor.Middle];
  const gapHandler = newGapHandler();
  const keyActions = {} as KeyActions;

  keyActions[`Equal`] = () => gapHandler.decreaseGap();
  keyActions[`Minus`] = () => gapHandler.increaseGap();
  keyActions[`KeyR`] = () => gapHandler.defaultize();

  const props = {
    scales,
    contexts,
    keyActions,
    hAnchor,
    vAnchor,
    gapHandler,
  };

  const methods = {
    setBoundaryData,
    setRenderData,
    render,
    check,
    query,
    setHAnchor,
    setVAnchor,
    setGapType,
    setGapDimension,
    setDefaultGap,
    noGap,
    remap,
  };

  const self = { ...props, ...methods };
  gapHandler.listen(self.render.bind(self));
  return self;
}

function render(this: RectanglesWH) {
  if (!this.renderData) return;

  const { renderData: data, scales, contexts } = this;
  const { hAnchor, vAnchor, gapHandler } = this;
  const n = data.n();

  for (const id of layers) contexts[id].clear();

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let w = data.col(`width`).scaledAt(i, scales.width);
    let h = data.col(`height`).scaledAt(i, scales.height);

    [w, h] = gapHandler.applyGap(w, h);
    contexts[layer].rectangleWH(x, y, w, h, { vAnchor, hAnchor });
  }
}

function check(this: RectanglesWH, coords: Rect) {
  if (!this.boundaryData) return new Set<number>();

  const { boundaryData: data, scales, vAnchor, hAnchor } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let w = data.col(`width`).scaledAt(i, scales.width);
    let h = data.col(`height`).scaledAt(i, scales.height);

    const selfCoords = [
      x - w * hAnchor,
      y - vAnchor * h,
      x + w * hAnchor,
      y + (1 - vAnchor) * h,
    ] as Rect;

    if (rectsIntersect(coords, selfCoords)) {
      mergeInto(selected, data.col(POSITIONS).valueAt(i));
    }
  }

  return selected;
}

function query(this: RectanglesWH, point: Point) {
  if (!this.boundaryData) return;

  const { boundaryData, renderData, scales, vAnchor, hAnchor } = this;
  const n = boundaryData.n();

  for (let i = 0; i < n; i++) {
    const x = boundaryData.col(`x`).scaledAt(i, scales.x);
    const y = boundaryData.col(`y`).scaledAt(i, scales.y);
    let w = boundaryData.col(`width`).scaledAt(i, scales.width);
    let h = boundaryData.col(`height`).scaledAt(i, scales.height);

    const selfCoords = [
      x - w * hAnchor,
      y - vAnchor * h,
      x + w * hAnchor,
      y + (1 - vAnchor) * h,
    ] as Rect;

    if (pointInRect(point, selfCoords)) {
      return getQueryInformation(i, boundaryData, renderData);
    }
  }
}

function setHAnchor(this: RectanglesWH, anchor: HorizontalAnchor) {
  this.hAnchor = anchor;
  return this;
}

function setVAnchor(this: RectanglesWH, anchor: VerticalAnchor) {
  this.vAnchor = anchor;
  return this;
}

function setGapType(this: RectanglesWH, type: GapType) {
  this.gapHandler.setGapType(type);
  return this;
}

function setGapDimension(this: RectanglesWH, dimension: GapDimension) {
  this.gapHandler.setGapDimension(dimension);
  return this;
}

function setDefaultGap(this: RectanglesWH, pct: number, px: number) {
  this.gapHandler.setDefaultGap(pct, px);
  return this;
}

function noGap(this: RectanglesWH) {
  this.gapHandler.applyGap = (w, h) => [w, h];
  return this;
}
