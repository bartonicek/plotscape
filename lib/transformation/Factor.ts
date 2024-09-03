import {
  binBreaks,
  compareAlphaNumeric,
  copyValues,
  diff,
  isArray,
  last,
  makeGetter,
  subset,
} from "../utils/funs";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import {
  Dataframe,
  Flat,
  Indexable,
  Stringable,
  TaggedUnion,
} from "../utils/types";

export const POSITIONS = Symbol(`positions`);

export interface Factor<T extends Dataframe = Dataframe> extends Reactive {
  type: Factor.Type;
  cardinality: number;
  indices: number[];
  parent?: Factor;
  data: T;
}

export namespace Factor {
  export enum Type {
    Constant,
    Bijection,
    Surjection,
  }

  type EventType = `changed`;

  export function of<T extends Dataframe>(
    type: Type,
    cardinality: number,
    indices: number[],
    data: T,
  ): Factor<T> {
    return Reactive.of2()({ type, cardinality, indices, data });
  }

  export function copyFrom<T extends Factor>(source: T, target: T) {
    target.cardinality = source.cardinality;
    copyValues(source.indices, target.indices);

    for (const k of Reflect.ownKeys(source.data)) {
      if (isArray(source.data[k]) && isArray(target.data[k])) {
        copyValues(source.data[k], target.data[k]);
        Meta.copy(target.data[k], source.data[k]);
      } else {
        target.data[k] = source.data[k];
      }
    }
  }

  export function bijection<T extends Dataframe>(
    data: T,
  ): Factor<Flat<T & { [POSITIONS]: Indexable<number[]> }>> {
    const cardinality = Infinity;
    const indices = [] as number[];
    const positions = (index: number) => [index];

    const type = Type.Bijection;
    const factorData = { ...data, [POSITIONS]: positions };

    return of(type, cardinality, indices, factorData);
  }

  export function mono(
    n: number,
  ): Factor<{ [POSITIONS]: Indexable<number[]> }> {
    const cardinality = 1;
    const indices = Array(n).fill(0);
    const positions = () => indices;

    const type = Type.Constant;
    const data = { [POSITIONS]: positions };

    return of(type, cardinality, indices, data);
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
    labels?: string[],
  ): Factor<{ label: string[]; [POSITIONS]: number[][] }> {
    const arr = array.map((x) => x.toString());
    labels = labels ?? Array.from(new Set(arr)).sort(compareAlphaNumeric);

    if (Meta.has(array, `name`)) Meta.copy(labels, array, [`name`]);

    const indices = [] as number[];
    const positions = {} as Record<number, number[]>;

    for (let i = 0; i < arr.length; i++) {
      const index = labels.indexOf(arr[i]);
      if (!positions[index]) positions[index] = [];

      indices.push(index);
      positions[index].push(i);
    }

    const type = Type.Surjection;
    const data = { label: labels, [POSITIONS]: Object.values(positions) };

    return of(type, labels.length, indices, data);
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
    options?: BinOptions | (BinOptions & Reactive),
  ): Factor<{
    binMin: number[];
    binMax: number[];
    breaks: number[];
    [POSITIONS]: number[][];
  }> {
    function compute() {
      const breaks = options?.breaks ?? binBreaks(array, options);

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

      const [min, max] = [breaks[sorted[0]], breaks[last(sorted) + 1]];
      Meta.setN(binMin, [`min`, `max`], [min, max]);
      Meta.setN(binMax, [`min`, `max`], [min, max]);
      Meta.set(binMin, `name`, `min of ${Meta.get(array, `name`)}`);
      Meta.set(binMax, `name`, `max of ${Meta.get(array, `name`)}`);
      Meta.copy(breaks, array, [`name`]);

      const type = Type.Surjection;
      const data = {
        binMin,
        binMax,
        breaks,
        [POSITIONS]: Object.values(positions),
      };

      return of(type, sorted.length, indices, data);
    }

    const factor = compute();
    if (options && Reactive.is(options)) {
      Reactive.listen(options, `changed`, () => {
        const newFactor = compute();
        Factor.copyFrom(newFactor, factor);
        Reactive.dispatch(factor, `changed`);
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
    factor2: Factor<U>,
  ): Factor<TaggedUnion<T, U>> {
    function compute() {
      if (factor1.type === Type.Bijection) {
        const data = {} as Dataframe;

        for (const k of Reflect.ownKeys(factor1.data)) {
          data[k] = Getter.of(factor1.data[k]);
        }

        for (const k of Reflect.ownKeys(factor2.data)) {
          data[k] = Getter.proxy(factor2.data[k], factor2.indices);
        }

        const type = Type.Bijection;
        const cardinality = factor2.indices.length;
        const indices = [] as number[];

        const result = of(type, cardinality, indices, data);
        result.parent = factor1;

        return result as Factor<TaggedUnion<T, U>>;
      }

      if (factor1.type === Type.Constant) {
        const { type, data, cardinality, indices } = factor2;

        const result = of(type, cardinality, indices, data);
        result.parent = factor1;

        return result as Factor<TaggedUnion<T, U>>;
      }

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
      for (let key of Reflect.ownKeys(factor1.data)) {
        let newKey = key as string;
        if (typeof key === "string") while (newKey in data) key += `$`;

        const [oldCol, inds] = [factor1.data[key], factor1ParentIndices];

        const newCol = isArray(oldCol)
          ? subset(oldCol, inds)
          : Getter.proxy(oldCol, inds);

        Meta.copy(newCol, oldCol);
        data[newKey] = newCol;
      }

      // Copy over parent data from factor 2
      for (let key of Reflect.ownKeys(factor2.data)) {
        let newKey = key as string;
        if (typeof key === "string") while (newKey in data) newKey += `$`;
        const [oldCol, inds] = [factor2.data[key], factor2ParentIndices];

        const newCol = isArray(oldCol)
          ? subset(oldCol, inds)
          : Getter.proxy(oldCol, inds);

        Meta.copy(newCol, oldCol);
        data[newKey] = newCol;
      }

      const type = Type.Surjection;
      data[POSITIONS] = Object.values(positions);

      type Data = TaggedUnion<T, U>;
      const result = of(type, sorted.length, indices, data) as Factor<Data>;
      result.parent = factor1;

      return result;
    }

    const factor = compute();

    Reactive.listen(factor1, `changed`, () => {
      const newFactor = compute();
      Factor.copyFrom(newFactor, factor);
    });

    Reactive.listen(factor2, `changed`, () => {
      const newFactor = compute();
      Factor.copyFrom(newFactor, factor);
    });

    Reactive.propagate(factor1, factor, `changed`);
    Reactive.propagate(factor2, factor, `changed`);

    return factor;
  }

  export function parentIndices(parentFactor: Factor, childFactor: Factor) {
    const result = {} as Record<number, number>;

    for (let i = 0; i < childFactor.indices.length; i++) {
      result[childFactor.indices[i]] = parentFactor.indices[i];
      if (Object.keys(result).length >= childFactor.cardinality) break;
    }

    return Object.values(result);
  }
}
