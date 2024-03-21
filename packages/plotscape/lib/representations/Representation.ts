import { Dict } from "utils";
import { Contexts } from "../plot/Plot";
import { Point, Rect } from "../types";

export interface Representation {
  render(contexts: Contexts): void;
  check(coords: Rect): Set<number>;
  query(point: Point): Dict | undefined;
}
