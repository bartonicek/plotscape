import { Context } from "../Context";
import { Dataframe } from "../dataframe/Dataframe";
import { rectsIntersect } from "../funs";
import { Rect, VerticalAnchor } from "../types";
import { Representation, check, query, render } from "./Representation";

type Encodings = {
  x: any;
  y0: any;
  y1: any;
};

type Scales = {
  x: any;
  y: any;
};

export interface Bars extends Representation<Encodings> {
  scales: Scales;
}

export function newBars(
  boundaryData: Dataframe<Encodings>,
  renderData: Dataframe<Encodings>,
  scales: Scales
): Bars {
  const props = { boundaryData, renderData, scales };
  const methods = { render, check, query, renderOne, checkOne, queryOne };
  const self = { ...props, ...methods };

  return self as unknown as Bars;
}

function renderOne(
  this: Bars,
  context: Context,
  data: Dataframe<Encodings>,
  i: number
) {
  const { scales } = this;
  const x = data.col(`x`).scaledAt(i, scales.x);
  const y0 = scales.y.pushforward(data.col(`y0`).valueAt(i));
  const y1 = scales.y.pushforward(data.col(`y1`).valueAt(i));
  const w = 10;

  context.rectangleWH(x, y0, w, y1 - y0, { vAnchor: VerticalAnchor.Bottom });
}

function checkOne(
  this: Bars,
  coords: Rect,
  data: Dataframe<Encodings>,
  i: number
) {
  const { scales } = this;
  const x = scales.x.pushforward(data.col(`x`).valueAt(i));
  const y0 = scales.y.pushforward(data.col(`y0`).valueAt(i));
  const y1 = scales.y.pushforward(data.col(`y1`).valueAt(i));
  const w = 10;

  return rectsIntersect(coords, [x - w / 2, y0, x + w / 2, y1]);
}

function queryOne(
  this: Bars,
  x: number,
  y: number,
  data: Dataframe<Encodings>,
  i: number
) {
  // const _x = data.col("x").scaledAt!(i);
  // const _y = data.col("y1").scaledAt!(i);
  // // const size = data.col("size").scaledAt(i) * this.sizeX();
  // const c = 5 / Math.sqrt(2);
  // if (rectsIntersect([x, y, x, y], [_x - c, _y - c, _x + c, _y + c])) {
  //   const result = {} as Record<string | symbol, any>;
  //   result[data.col("x").name()] = data.col("x").valueAt(i);
  //   result[data.col("y1").name()] = data.col("y1").valueAt(i);
  //   // for (const q of data.queryables) result[q.name()] = q.valueAt(i);
  //   return result as Record<string, any>;
  // }
}
