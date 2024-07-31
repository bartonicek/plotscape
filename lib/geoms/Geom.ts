import { Scale } from "../main";
import { Indexable, Layers, Rect } from "../utils/types";
import { Points } from "./Points";

export enum GeomType {
  Points,
}

export interface Geom {
  type: GeomType;
  data: {
    flat: Record<string, Indexable>;
    grouped: Record<string, Indexable>;
  };
  scales: Record<string, Scale>;
}

type GeomMethods = {
  render(geom: Geom, layers: Layers): void;
  check(geom: Geom, selection: Rect): number[];
};

export namespace Geom {
  const methods: {
    [key in GeomType]: GeomMethods;
  } = { [GeomType.Points]: Points };

  export function render<T extends Geom>(geom: T, layers: Layers) {
    methods[geom.type].render(geom, layers);
  }

  export function check<T extends Geom>(geom: T, selection: Rect) {
    return methods[geom.type].check(geom, selection);
  }
}
