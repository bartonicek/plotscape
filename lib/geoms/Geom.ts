import { Scale } from "../main";
import { makeGetter } from "../utils/funs";
import { LAYER, POSITIONS } from "../utils/symbols";
import { Data, DataLayer, DataLayers, Indexable, Rect } from "../utils/types";
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

export type GeomData = { flat: Data; grouped: Data };

export interface Geom<T extends GeomData = GeomData> {
  type: GeomType;
  data: T;
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

  export function get<T extends Data, U extends (keyof T)[]>(
    data: T,
    keys: U,
    fallback: (index: number) => any = () => 0.5
  ) {
    return keys.map((x) => makeGetter(data[x] ?? fallback));
  }

  export function render<T extends Geom>(geom: T, layers: DataLayers) {
    methods[geom.type].render(geom, layers);
  }

  export function check<T extends Geom>(geom: T, selection: Rect) {
    return methods[geom.type].check(geom, selection);
  }
}
