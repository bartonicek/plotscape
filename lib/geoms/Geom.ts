import { Frame } from "../plot/Frame";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";

import { Dataframe } from "../utils/Dataframe";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { DataLayer, DataLayers, Indexable, Point, Rect } from "../utils/types";
import { Bars } from "./Bars";
import { Lines } from "./Lines";
import { Points } from "./Points";
import { Rectangles } from "./Rectangles";

export type FlatData = { [Factor.POSITIONS]: Indexable<number[]> };
export type GroupedData = {
  [Factor.POSITIONS]: Indexable<number[]>;
  [LAYER]: Indexable<DataLayer>;
};

export type FactorData = {
  [Factor.POSITIONS]: Indexable<number[]>;
  [LAYER]: Indexable<DataLayer>;
};

export interface Geom<T extends Dataframe = Dataframe> {
  type: Geom.Type;
  data: (T & FactorData)[];
  scales: Record<string, Scale>;
}

type GeomMethods = {
  render(geom: Geom, layers: DataLayers): void;
  check(geom: Geom, selection: Rect): number[];
  query(geom: Geom, point: Point): Record<string, any> | undefined;
};

export namespace Geom {
  export enum Type {
    Points,
    Bars,
    Rectangles,
    Lines,
  }

  const methods: { [key in Type]: GeomMethods } = {
    [Type.Points]: Points,
    [Type.Bars]: Bars,
    [Type.Rectangles]: Rectangles,
    [Type.Lines]: Lines,
  };

  export function render<T extends Geom>(geom: T, layers: DataLayers) {
    methods[geom.type].render(geom, layers);
  }

  export function check<T extends Geom>(geom: T, selection: Rect) {
    return methods[geom.type].check(geom, selection);
  }

  export function query<T extends Geom>(geom: T, position: Point) {
    return methods[geom.type].query(geom, position);
  }

  export function flatData(geom: Geom) {
    return geom.data[geom.data.length - 2];
  }

  export function groupedData(geom: Geom) {
    return geom.data[geom.data.length - 1];
  }

  export function getter<T extends Indexable>(
    indexable: T,
    fallback: (index: number) => any = () => 0.5,
  ) {
    return Getter.of(indexable ?? fallback);
  }

  export function getters<T extends Dataframe, U extends readonly (keyof T)[]>(
    data: T,
    keys: U,
    fallback: (index: number) => any = () => 0.5,
  ) {
    return keys.map((x) => Geom.getter(data[x], fallback));
  }

  export function frames(
    length: number,
    layerId: Indexable<DataLayer>,
    layers: DataLayers,
  ): Frame[] {
    const [layer, getter] = [Array(length), Getter.of(layerId)];
    for (let i = 0; i < length; i++) layer[i] = layers[getter(i)];
    return layer;
  }

  export function scaledArrays(length: number, pairs: [Indexable, Scale][]) {
    const result = [];

    for (const [indexable, scale] of pairs) {
      const array = Array(length);
      const getter = Getter.of(indexable ?? 1);

      for (let i = 0; i < length; i++) {
        array[i] = Scale.pushforward(scale, getter(i));
      }

      result.push(array);
    }

    return result;
  }

  export function getQueryInfo(data: Dataframe, indices: number[]) {
    const i = indices[0];
    const dimRow = getQueryRow(data, i, { dimension: `only` });
    const rows = [dimRow];

    for (let j = 0; j < indices.length; j++) {
      const k = indices[j];

      const row = getQueryRow(data, k, { dimension: `exclude` });
      (row as any)[LAYER] = Getter.of(data[LAYER])(k);
      rows.push(row);
    }

    return rows;
  }

  function getQueryRow(
    data: Dataframe,
    index: number,
    options?: { dimension?: `exclude` | `only` },
  ) {
    const result = {} as Record<string, any>;
    const dimension = options?.dimension;

    for (const v of Object.values(data)) {
      if (dimension === `exclude` && Meta.get(v, `isDimension`)) continue;
      if (dimension === `only` && !Meta.get(v, `isDimension`)) continue;

      const [n, q, r] = Meta.get(v, [`name`, `queryable`, `reduced`]);
      if (!n || !q) continue;

      // Get original values because might be e.g. stacked/shifted otherwise
      const variable = r ? v[Reduced.ORIGINAL_VALUES] : v;
      const getter = Getter.of(variable);

      result[n] = getter(index);
    }

    return result;
  }
}
