import { Frame } from "../plot/Frame";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { POSITIONS } from "../transformation/Factor";
import { Getter } from "../utils/Getter";
import {
  Dataframe,
  DataLayer,
  DataLayers,
  Indexable,
  Point,
  Rect,
} from "../utils/types";
import { Bars } from "./Bars";
import { Lines } from "./Lines";
import { Points } from "./Points";
import { Rectangles } from "./Rectangles";

export type FlatData = { [POSITIONS]: Indexable<number[]> };
export type GroupedData = {
  [POSITIONS]: Indexable<number[]>;
  [LAYER]: Indexable<DataLayer>;
};

export type FactorData = {
  [POSITIONS]: Indexable<number[]>;
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

  export function layer(
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
