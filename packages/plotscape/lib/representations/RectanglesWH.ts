import { mergeInto, values } from "utils";
import { pointInRect, rectsIntersect } from "../funs";
import { ContextId, Contexts, Plot } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { HorizontalAnchor, Point, Rect, VerticalAnchor } from "../types";
import {
  Representation,
  mapEncodingToScale,
  setBoundaryData,
  setRenderData,
} from "./Representation";

type Encodings = {
  x: any;
  y: any;
  width: any;
  height: any;
};

export interface RectanglesWH extends Representation<Encodings> {
  hAnchor: HorizontalAnchor;
  vAnchor: VerticalAnchor;

  widthPct: number;
  heightPct: number;
  widthGapPx: number;
  heightGapPx: number;

  setHAnchor(anchor: HorizontalAnchor): this;
  setVAnchor(anchor: VerticalAnchor): this;
  setWidthPct(value: number): this;
  setHeightPct(value: number): this;
  setWidthGapPx(value: number): this;
  setHeightGapPx(value: number): this;
}

export function newRectanglesWH(plot: Plot): RectanglesWH {
  const scales = { ...plot.scales };
  const [hAnchor, vAnchor] = [HorizontalAnchor.Center, VerticalAnchor.Middle];
  const [widthPct, heightPct] = [1, 1];
  const [widthGapPx, heightGapPx] = [0, 0];

  const pars = {
    hAnchor,
    vAnchor,
    widthPct,
    heightPct,
    widthGapPx,
    heightGapPx,
  };

  const props = { scales };
  const methods = {
    setBoundaryData,
    setRenderData,
    render,
    check,
    query,
    setHAnchor,
    setVAnchor,
    setWidthPct,
    setHeightPct,
    setWidthGapPx,
    setHeightGapPx,
    mapEncodingToScale,
  };
  const self = { ...pars, ...props, ...methods };

  return self;
}

function render(this: RectanglesWH, contexts: Contexts) {
  if (!this.renderData) return;

  const { renderData: data, scales, hAnchor, vAnchor } = this;
  const { widthPct, heightPct, heightGapPx, widthGapPx } = this;
  const n = data.n();

  for (let i = 0; i < n; i++) {
    const layer = data.col(LAYER).valueAt(i) as ContextId;

    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let w = data.col(`width`).scaledAt(i, scales.width) * widthPct;
    let h = data.col(`height`).scaledAt(i, scales.height) * heightPct;

    w = w * widthPct - widthGapPx;
    h = h * heightPct - heightGapPx;

    contexts[layer].rectangleWH(x, y, w, h, { vAnchor, hAnchor });
  }
}

function check(this: RectanglesWH, coords: Rect) {
  if (!this.boundaryData) return new Set<number>();

  const { boundaryData: data, scales, vAnchor, hAnchor } = this;
  const { widthPct, heightPct, heightGapPx, widthGapPx } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let w = data.col(`width`).scaledAt(i, scales.width) * widthPct;
    let h = data.col(`height`).scaledAt(i, scales.height) * heightPct;

    w = w * widthPct - widthGapPx;
    h = h * heightPct - heightGapPx;

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

  const { boundaryData: data, scales, vAnchor, hAnchor } = this;
  const { widthPct, heightPct, heightGapPx, widthGapPx } = this;
  const n = data.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const x = data.col(`x`).scaledAt(i, scales.x);
    const y = data.col(`y`).scaledAt(i, scales.y);
    let w = data.col(`width`).scaledAt(i, scales.width) * widthPct;
    let h = data.col(`height`).scaledAt(i, scales.height) * heightPct;

    w = w * widthPct - widthGapPx;
    h = h * heightPct - heightGapPx;

    const selfCoords = [
      x - w * hAnchor,
      y - vAnchor * h,
      x + w * hAnchor,
      y + (1 - vAnchor) * h,
    ] as Rect;

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
}

function setHAnchor(this: RectanglesWH, anchor: HorizontalAnchor) {
  this.hAnchor = anchor;
  return this;
}

function setVAnchor(this: RectanglesWH, anchor: VerticalAnchor) {
  this.vAnchor = anchor;
  return this;
}

function setWidthPct(this: RectanglesWH, value: number) {
  this.widthPct = value;
  return this;
}

function setHeightPct(this: RectanglesWH, value: number) {
  this.heightPct = value;
  return this;
}

function setWidthGapPx(this: RectanglesWH, value: number) {
  this.widthGapPx = value;
  return this;
}

function setHeightGapPx(this: RectanglesWH, value: number) {
  this.heightGapPx = value;
  return this;
}
