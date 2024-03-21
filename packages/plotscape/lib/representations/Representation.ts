import { Dict } from "utils";
import { Contexts, Scales } from "../plot/Plot";
import { Point, Rect } from "../types";

export interface Representation {
  scales: Scales;

  render(contexts: Contexts): void;
  check(coords: Rect): Set<number>;
  query(point: Point): Dict | undefined;

  mapEncodingToScale(from: keyof Scales, to: keyof Scales): void;
}

export function mapEncodingToScale(
  this: Representation,
  target: keyof Scales,
  source: keyof Scales
) {
  this.scales[target] = this.scales[source];
}
