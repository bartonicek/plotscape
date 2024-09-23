import { Plot, Poly } from "../main";
import { Frame } from "../plot/Frame";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";

import { Dataframe } from "../utils/Dataframe";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { DataLayer, DataLayers, Indexable, Point, Rect } from "../utils/types";

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
  scales: Plot.Scales;
}

export namespace Geom {
  export type Type = `points` | `bars` | `rectangles` | `lines`;

  // Polymorphic functions
  export const render = Poly.of(renderDefault);
  export const check = Poly.of(checkDefault);
  export const query = Poly.of(queryDefault);

  // @ts-ignore - Need to infer function signatures
  function renderDefault<T extends Geom>(geom: T, layers: DataLayers) {
    throw new Error(
      `Method 'render' not implemented for geom of type '${geom.type}'`,
    );
  }

  // @ts-ignore
  function checkDefault<T extends Geom>(geom: T, selection: Rect): number[] {
    throw new Error(
      `Method 'check' not implemented for geom of type '${geom.type}'`,
    );
  }

  function queryDefault<T extends Geom>(
    geom: T,
    // @ts-ignore
    point: Point,
  ): Record<string, any>[] | undefined {
    throw new Error(
      `Method 'render' not implemented for geom of type '${geom.type}'`,
    );
  }

  export function flatData<T extends Geom>(geom: T) {
    return geom.data[geom.data.length - 2];
  }

  export function groupedData<T extends Geom>(geom: T) {
    return geom.data[geom.data.length - 1];
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
