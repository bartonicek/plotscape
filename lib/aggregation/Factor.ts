import { Reactive } from "../Reactive";
import {
  computeBreaks,
  copyValues,
  diff,
  makeDispatchFn,
  makeGetter,
  makeListenFn,
  subset,
} from "../utils/funs";
import { POSITIONS } from "../utils/symbols";
import { Dataframe, Flat, Stringable } from "../utils/types";

export interface Factor<T extends Dataframe = Dataframe> extends Reactive {
  cardinality: number;
  indices: number[];
  parent?: Factor;
  parentIndices?: number[];
  data: T;
}

type EventType = `changed`;

export namespace Factor {
  export function of<T extends Dataframe>(
    cardinality: number,
    indices: number[],
    data: T
  ): Factor<T> {
    return Reactive.of({ cardinality, indices, data });
  }

  export const listen = makeListenFn<Factor, EventType>();
  export const dispatch = makeDispatchFn<Factor, EventType>();

  export function copyFrom<T extends Factor>(source: T, target: T) {
    target.cardinality = source.cardinality;

    copyValues(source.indices, target.indices);

    if (target.parentIndices && source.parentIndices) {
      copyValues(source.parentIndices, target.parentIndices);
    }

    for (const k of Reflect.ownKeys(source.data)) {
      copyValues(source.data[k], target.data[k]);
    }

    copyValues(source.data[POSITIONS], target.data[POSITIONS]);
  }

  /**
   * Creates a factor by coercing values into strings & treating equivalent
   * strings as the same level.
   * @param array An array of values that have a `toString()` method
   * @param labels An optional array of labels
   * @returns A factor
   */
  export function from(
    array: Stringable[],
    labels?: string[]
  ): Factor<{ label: string[]; [POSITIONS]: number[][] }> {
    const arr = array.map((x) => x.toString());
    labels = labels ?? Array.from(new Set(arr)).sort();

    const indices = [] as number[];
    const positions = {} as Record<number, number[]>;

    for (let i = 0; i < arr.length; i++) {
      const index = labels.indexOf(arr[i]);
      if (!positions[index]) positions[index] = [];

      indices.push(index);
      positions[index].push(i);
    }

    const data = { label: labels, [POSITIONS]: Object.values(positions) };

    return of(labels.length, indices, data);
  }

  type BinOptions = {
    breaks?: number[];
    width?: number;
    anchor?: number;
    nBins?: number;
  };

  /**
   * Creates a factor by binning a numeric array.
   * @param array An array of numbers
   * @param options A list of binning options
   * @returns A factor
   */
  export function bin(
    array: number[],
    options?: BinOptions | (BinOptions & Reactive)
  ): Factor<{
    binMin: number[];
    binMax: number[];
    [POSITIONS]: number[][];
  }> {
    function compute() {
      const breaks = options?.breaks ?? computeBreaks(array, options);

      const uniqueIndices = new Set<number>();
      const indices = [] as number[];
      const positions = {} as Record<number, number[]>;

      for (let i = 0; i < array.length; i++) {
        // index is in (binMin, binMax] (top limit inclusive)
        const index = breaks!.findIndex((br) => br >= array[i]) - 1;
        if (!positions[index]) positions[index] = [];

        indices.push(index);
        positions[index].push(i);
        uniqueIndices.add(index);
      }

      // Need to clean up indices by removing unused ones,
      // e.g. [0, 2, 3, 2, 5] -> [0, 1, 2, 1, 3]
      const sorted = Array.from(uniqueIndices).sort(diff);
      for (let i = 0; i < indices.length; i++) {
        indices[i] = sorted.indexOf(indices[i]);
      }

      const [binMin, binMax] = [[], []] as [number[], number[]];
      for (let i = 0; i < sorted.length; i++) {
        binMin.push(breaks[sorted[i]]);
        binMax.push(breaks[sorted[i] + 1]);
      }

      const data = { binMin, binMax, [POSITIONS]: Object.values(positions) };

      return of(sorted.length, indices, data);
    }

    const factor = compute();
    if (options && Reactive.isReactive(options)) {
      Reactive.listen(options, `changed`, () => {
        const newFactor = compute();
        Factor.copyFrom(factor, newFactor);
        Factor.dispatch(factor, `changed`);
      });
    }

    return factor;
  }

  /**
   * Creates a factor by taking the Cartesian product of two existing factors.
   * @param factor1 The first factor
   * @param factor2 The second factor
   * @returns A factor which has as its levels all of the unique combinations
   * of the levels of the two factors (and the corresponding data)
   */
  export function product<T extends Dataframe, U extends Dataframe>(
    factor1: Factor<T>,
    factor2: Factor<U>
  ): Factor<Flat<T & U>> {
    function compute() {
      const k = Math.max(factor1.cardinality, factor2.cardinality) + 1;

      const uniqueIndices = new Set<number>();
      const indices = [] as number[];
      const positions = {} as Record<number, number[]>;

      const factor1Map = {} as Record<number, number>;
      const factor2Map = {} as Record<number, number>;

      const f1Index = makeGetter(factor1.indices);
      const f2Index = makeGetter(factor2.indices);

      for (let i = 0; i < factor1.indices.length; i++) {
        const [f1level, f2level] = [f1Index(i), f2Index(i)];
        const index = k * f1level + f2level;

        // We have not seen this combination of factor levels before
        if (!(index in factor1Map)) {
          factor1Map[index] = f1level;
          factor2Map[index] = f2level;
          positions[index] = [];
        }

        indices.push(index);
        positions[index].push(i);
        uniqueIndices.add(index);
      }

      // Need to clean up indices by removing unused ones,
      // e.g. [0, 2, 3, 2, 5] -> [0, 1, 2, 1, 3]
      const sorted = Array.from(uniqueIndices).sort(diff);
      for (let i = 0; i < indices.length; i++) {
        indices[i] = sorted.indexOf(indices[i]);
      }

      const factor1ParentIndices = Object.values(factor1Map);
      const factor2ParentIndices = Object.values(factor2Map);

      const data = {} as Dataframe;

      // Copy over parent data from factor 1
      for (let k of Reflect.ownKeys(factor1.data)) {
        if (typeof k === "string") while (k in data) k += `$`;
        const col = subset(factor1.data[k], factor1ParentIndices);
        data[k] = col;
      }

      // Copy over parent data from factor 2
      for (let k of Reflect.ownKeys(factor2.data)) {
        if (typeof k === "string") while (k in data) k += `$`;
        const col = subset(factor2.data[k], factor2ParentIndices);
        data[k] = col;
      }

      data[POSITIONS] = Object.values(positions);

      const result = of(sorted.length, indices, data) as Factor<T & U>;
      result.parentIndices = factor1ParentIndices;
      result.parent = factor1;

      return result;
    }

    const factor = compute();

    Factor.listen(factor1, `changed`, () => {
      const newFactor = compute();
      Factor.copyFrom(newFactor, factor);
      Factor.dispatch(factor, `changed`);
    });

    Factor.listen(factor2, `changed`, () => {
      const newFactor = compute();
      Factor.copyFrom(newFactor, factor);
      Factor.dispatch(factor, `changed`);
    });

    return factor;
  }
}
