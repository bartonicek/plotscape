import { Context } from "../Context";
import { Dataframe } from "../dataframe/Dataframe";
import { rectsIntersect } from "../funs";
import { Scales } from "../plot/Plot";
import { Rect } from "../types";
import { Continuous } from "../variables/Continuous";
import { Discrete } from "../variables/Discrete";
import { Representation, check, query, render } from "./Representation";

type Encodings = {
  x: Continuous | Discrete;
  y: Continuous | Discrete;
  size?: Continuous;
};

export interface Points extends Representation<Encodings> {}

export function newPoints<T extends Encodings, U extends Encodings>(
  boundaryData: Dataframe<T>,
  renderData: Dataframe<U>,
  scales: Scales
): Points {
  const props = { boundaryData, renderData, scales };
  const methods = { render, check, query, renderOne, checkOne, queryOne };
  const self = { ...props, ...methods };

  return self as unknown as Points;
}

function renderOne(
  this: Points,
  context: Context,
  data: Dataframe<Encodings>,
  i: number
) {
  const { scales } = this;
  const x = scales.x.pushforward(data.col(`x`).valueAt(i));
  const y = scales.y.pushforward(data.col(`y`).valueAt(i));

  context.point(x, y);
}

function checkOne(
  this: Points,
  coords: Rect,
  data: Dataframe<Encodings>,
  i: number
) {
  const { scales } = this;
  const x = scales.x.pushforward(data.col(`x`).valueAt(i));
  const y = scales.y.pushforward(data.col(`y`).valueAt(i));

  const c = 5 / Math.sqrt(2);
  return rectsIntersect(coords, [x - c, y - c, x + c, y + c]);
}

function queryOne(
  this: Points,
  x: number,
  y: number,
  data: Dataframe<Encodings>,
  i: number
) {
  // const _x = data.col("x").scaledAt!(i);
  // const _y = data.col("y").scaledAt!(i);
  // // const size = data.col("size").scaledAt(i) * this.sizeX();
  // const c = 5 / Math.sqrt(2);
  // if (rectsIntersect([x, y, x, y], [_x - c, _y - c, _x + c, _y + c])) {
  //   const result = {} as Record<string | symbol, any>;
  //   result[data.col("x").name()] = data.col("x").valueAt(i);
  //   result[data.col("y").name()] = data.col("y").valueAt(i);
  //   // for (const q of data.queryables) result[q.name()] = q.valueAt(i);
  //   return result as Record<string, any>;
  // }
}
