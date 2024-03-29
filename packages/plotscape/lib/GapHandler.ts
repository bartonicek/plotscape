import { diff, prod } from "utils";
import { Observable, observable } from "./mixins/Observable";

export enum GapType {
  Pct,
  Px,
}

export enum GapDimension {
  Width,
  Both,
  Height,
}

export interface GapHandler extends Observable {
  type: GapType;
  dimension: GapDimension;

  amount: number;
  defaultGapPct: number;
  defaultGapPx: number;

  setGapType(type: GapType): this;
  setGapDimension(dimension: GapDimension): this;
  setDefaultGap(pct: number, px: number): this;

  defaultize(): this;
  increaseGap(): this;
  decreaseGap(): this;

  applyGap(width: number, height: number): [number, number];
}

export function newGapHandler(): GapHandler {
  const type = GapType.Pct;
  const dimension = GapDimension.Both;

  const amount = 0.8;
  const [defaultGapPct, defaultGapPx] = [0.8, 1];

  const props = {
    type,
    dimension,
    amount,
    defaultGapPct,
    defaultGapPx,
  };

  const methods = {
    setGapType,
    setGapDimension,
    setDefaultGap,
    defaultize,
    decreaseGap,
    increaseGap,
    applyGap,
  };

  const self = observable({ ...props, ...methods });
  return self;
}

function setGapType(this: GapHandler, type: GapType) {
  const { defaultGapPct, defaultGapPx } = this;
  this.amount = type === GapType.Pct ? defaultGapPct : defaultGapPx;
  this.type = type;
  this.emit();
  return this;
}

function setGapDimension(this: GapHandler, dimension: GapDimension) {
  this.dimension = dimension;
  this.emit();
  return this;
}

function setDefaultGap(this: GapHandler, pct: number, px: number) {
  const { type } = this;
  this.amount = type === GapType.Pct ? pct : px;
  this.defaultGapPct = pct;
  this.defaultGapPx = px;
  return this;
}

function defaultize(this: GapHandler) {
  const { type: gapType, defaultGapPct, defaultGapPx } = this;
  this.amount = gapType === GapType.Pct ? defaultGapPct : defaultGapPx;
  this.emit();
  return this;
}

function increaseGap(this: GapHandler) {
  if (this.type === GapType.Pct) this.amount = (this.amount * 9) / 10;
  else this.amount = Math.max(this.amount - 1, 0);
  this.emit();
  return this;
}

function decreaseGap(this: GapHandler) {
  if (this.type === GapType.Pct) this.amount = (this.amount * 10) / 9;
  else this.amount++;
  this.emit();
  return this;
}

function applyGap(this: GapHandler, width: number, height: number) {
  const { type: gapType, dimension: gapDimension, amount } = this;

  const operation = gapType === GapType.Pct ? prod : diff;

  if (gapDimension <= 1) width = operation(width, amount);
  if (gapDimension >= 1) height = operation(height, amount);

  return [width, height] as [number, number];
}
