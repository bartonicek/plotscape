import { mergeSetIntoAnother } from "utils";
import { Context } from "../Context";
import { Dataframe } from "../dataframe/Dataframe";
import { ContextId, Contexts, layers } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Rect } from "../types";

export interface Representation {
  renderData: Dataframe<any>;
  boundaryData: Dataframe<any>;
  render(contexts: Contexts): void;
  check(coords: Rect): Set<number>;
  query(x: number, y: number): Record<string, any> | undefined;
  renderOne(contexts: Context, data: Dataframe<any>, i: number): void;
  checkOne(coords: Rect, data: Dataframe<any>, i: number): boolean;
  queryOne(
    x: number,
    y: number,
    data: Dataframe<any>,
    i: number
  ): Record<string, any> | undefined;
}

export function render(this: Representation, contexts: Contexts) {
  const { renderData } = this;
  const n = renderData.n();

  for (const l of layers) contexts[l].clear();
  for (let i = 0; i < n; i++) {
    const layer = renderData.col(LAYER).valueAt(i) as ContextId;
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
