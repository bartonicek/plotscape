import { Scale } from "../main";
import { LAYER, POSITIONS } from "../utils/symbols";
import { DataLayer, DataLayers, Indexable, Rect } from "../utils/types";
import { Bars } from "./Bars";
import { Points } from "./Points";

export enum GeomType {
  Points,
  Bars,
}

export type FlatData = { [POSITIONS]: Indexable<number[]> };
export type GroupedData = {
  [POSITIONS]: Indexable<number[]>;
  [LAYER]: Indexable<DataLayer>;
};

export interface Geom {
  type: GeomType;
  data: {
    flat: Record<string, Indexable>;
    grouped: Record<string, Indexable>;
  };
  scales: Record<string, Scale>;
}

type GeomMethods = {
  render(geom: Geom, layers: DataLayers): void;
  check(geom: Geom, selection: Rect): number[];
};

export namespace Geom {
  const methods: {
    [key in GeomType]: GeomMethods;
  } = { [GeomType.Points]: Points, [GeomType.Bars]: Bars };

  export function render<T extends Geom>(geom: T, layers: DataLayers) {
    methods[geom.type].render(geom, layers);
  }

  export function check<T extends Geom>(geom: T, selection: Rect) {
    return methods[geom.type].check(geom, selection);
  }
}
