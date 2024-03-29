import { Dict } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { Contexts, Scales } from "../plot/Plot";
import {
  BoundaryCols,
  KeyActions,
  Point,
  Rect,
  RenderCols,
  Variables,
} from "../types";

export interface Representation<T extends Variables = Variables> {
  boundaryData?: Dataframe<T & BoundaryCols>;
  renderData?: Dataframe<T & RenderCols>;
  scales: Scales;
  contexts: Contexts;
  keyActions?: KeyActions;

  setBoundaryData(data: Dataframe<T & BoundaryCols>): void;
  setRenderData(data: Dataframe<T & RenderCols>): void;

  render(contexts: Contexts): void;
  check(coords: Rect): Set<number>;
  query(point: Point): Dict | undefined;

  mapEncodingToScale(from: keyof Scales, to: keyof Scales): void;
}

export function setBoundaryData<T extends Variables>(
  this: Representation<T>,
  data: Dataframe<T & BoundaryCols>
) {
  this.boundaryData = data;
}

export function setRenderData<T extends Variables>(
  this: Representation<T>,
  data: Dataframe<T & RenderCols>
) {
  this.renderData = data;
}

export function mapEncodingToScale(
  this: Representation,
  target: keyof Scales,
  source: keyof Scales
) {
  this.scales[target] = this.scales[source];
}
