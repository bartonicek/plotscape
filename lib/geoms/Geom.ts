import { Scale } from "../main";
import { makeGetter } from "../utils/funs";
import { LAYER, POSITIONS } from "../utils/symbols";
import {
  Dataframe,
  DataLayer,
  DataLayers,
  Indexable,
  Point,
  Rect,
} from "../utils/types";
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

export type GeomData = { flat: Dataframe; grouped: Dataframe };

export interface Geom<T extends GeomData = GeomData> {
  type: GeomType;
  data: T;
  scales: Record<string, Scale>;
}

type GeomMethods = {
  render(geom: Geom, layers: DataLayers): void;
  check(geom: Geom, selection: Rect): number[];
  query(geom: Geom, point: Point): Record<string, any> | undefined;
};

export namespace Geom {
  const methods: { [key in GeomType]: GeomMethods } = {
    [GeomType.Points]: Points,
    [GeomType.Bars]: Bars,
  };

  export function getter<T extends Indexable>(
    indexable: T,
    fallback: (index: number) => any = () => 0.5
  ) {
    return makeGetter(indexable ?? fallback);
  }

  export function getters<T extends Dataframe, U extends readonly (keyof T)[]>(
    data: T,
    keys: U,
    fallback: (index: number) => any = () => 0.5
  ) {
    return keys.map((x) => Geom.getter(data[x], fallback));
  }

  export function render<T extends Geom>(geom: T, layers: DataLayers) {
    methods[geom.type].render(geom, layers);
  }

  export function check<T extends Geom>(geom: T, selection: Rect) {
    return methods[geom.type].check(geom, selection);
  }

  export function query<T extends Geom>(geom: T, position: Point) {
    return methods[geom.type].query(geom, position);
  }
}
