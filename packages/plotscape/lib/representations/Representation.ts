import { mergeSetIntoAnother } from "utils";
import { Context } from "../Context";
import { MarkerCols } from "../Marker";
import { Dataframe } from "../dataframe/Dataframe";
import { Contexts, layers } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Rect, Variables } from "../types";

export interface Representation<T extends Variables = Variables> {
  renderData: Dataframe<T & MarkerCols>;
  boundaryData: Dataframe<T & MarkerCols>;
  render(contexts: Contexts): void;
  check(coords: Rect): Set<number>;
  query(x: number, y: number): Record<string, any> | undefined;
  renderOne(
    contexts: Context,
    data: Dataframe<T & MarkerCols>,
    i: number
  ): void;
  checkOne(coords: Rect, data: Dataframe<T & MarkerCols>, i: number): boolean;
  queryOne(
    x: number,
    y: number,
    data: Dataframe<T & MarkerCols>,
    i: number
  ): Record<string, any> | undefined;
}

export function render(this: Representation, contexts: Contexts) {
  const { renderData } = this;
  const n = renderData.n();

  for (const l of layers) contexts[l].clear();
  for (let i = 0; i < n; i++) {
    const layer = renderData.col(LAYER).valueAt(i);
    this.renderOne(contexts[layer], renderData, i);
  }
}

export function check(this: Representation, coords: Rect) {
  const { boundaryData } = this;
  const n = boundaryData.n();
  const selected = new Set<number>();

  for (let i = 0; i < n; i++) {
    const positions = boundaryData.col(POSITIONS).valueAt(i);
    if (this.checkOne(coords, boundaryData, i)) {
      mergeSetIntoAnother(selected, positions);
    }
  }

  return selected;
}

export function query(this: Representation, x: number, y: number) {
  const { boundaryData } = this;
  const n = boundaryData.n();

  for (let i = 0; i < n; i++) {
    const result = this.queryOne(x, y, boundaryData, i);
    if (result) return result;
  }
}
