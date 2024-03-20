import { Dict } from "utils";
import { Context } from "../Context";
import { Dataframe } from "../dataframe/Dataframe";
import { Point, Rect, Variables } from "../types";

export interface Representation<T extends Variables> {
  render(data: Dataframe<T>, index: number, context: Context): void;
  check(data: Dataframe<T>, index: number, coords: Rect): boolean;
  query(data: Dataframe<T>, index: number, point: Point): Dict | undefined;
}
