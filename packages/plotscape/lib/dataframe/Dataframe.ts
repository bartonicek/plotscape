import {
  Normalize,
  allEntries,
  cleanProps,
  error,
  subsetOnIndices,
  uniqueIntegers,
  values,
} from "utils";
import { Observable, observable } from "../mixins/Observable";
import { RowOf, SymbolProps, VariableValue, Variables } from "../types";
import { ColumnParser, ParsedColumns } from "./ColumnParser";

/** Stores and provides access to variables. */
export interface Dataframe<T extends Variables = Variables> extends Observable {
  columns: T;
  n(): number;
  keys(): string[];
  col<K extends keyof T>(key: K): T[K];
  cols(): T;
  row(index: number, row?: RowOf<T>): RowOf<T>;
  rows(): RowOf<T>[];
  select<U extends Partial<Variables>>(
    selectfn: (cols: T) => U
  ): Dataframe<SymbolProps<T> & U>;
  cachedN?(): number;
  join<U extends Variables>(other: Dataframe<U>): Dataframe<Normalize<T & U>>;
  proxy(indices: number[]): Dataframe<T>;
}

export function newDataframe<T extends Variables>(columns: T): Dataframe<T> {
  const tag = `Dataframe`;
  const props = { [Symbol.toStringTag]: tag, columns };
  const methods = {
    n,
    keys,
    col,
    cols,
    row,
    rows,
    select,
    join,
    proxy,
  };
  const self = { ...props, ...methods };

  return observable(self);
}

export function parseColumns<T extends Record<string, ColumnParser>>(
  rawData: any,
  parseSpec: T,
  options?: { maxRows?: number; sample?: number }
) {
  const columns = {} as any;
  const data = newDataframe<ParsedColumns<T>>(columns);

  const { maxRows, sample } = options ?? {};
  const lengthFirst = (Object.values(rawData)[0] as any[]).length;
  const sampleIndices = uniqueIntegers(0, lengthFirst - 1, sample ?? 1);
  let seenLength = 0;

  for (const [k, v] of Object.entries(parseSpec)) {
    if (!(k in rawData)) error(`Property ${k} missing from raw data`);
    if (!Array.isArray(rawData[k])) error(`Property "${k}" is not an array.`);

    let array = rawData[k];
    if (seenLength === 0) seenLength = array.length;
    if (array.length != seenLength) {
      error(`Array "${k}" has different length from previously seen columns`);
    }

    if (sample) array = subsetOnIndices(array, sampleIndices);
    if (maxRows && array.length > maxRows) array.length = maxRows;

    if (!v.hasName()) v.setName(k);

    const variable = v.parse(array);
    variable.setName(v.name());

    columns[k] = variable;
  }

  return data;
}

function n(this: Dataframe): number {
  if (this.cachedN) return this.cachedN();
  for (const col of values(this.columns)) {
    if (col.n()) {
      this.cachedN = col.n.bind(col) as () => number;
      return this.cachedN!();
    }
  }
  throw new Error(`No fixed-length variables present in the data`);
}

function keys<T extends Variables>(this: Dataframe<T>) {
  return Object.keys(this.columns);
}

function col<T extends Variables, K extends keyof T>(
  this: Dataframe<T>,
  key: K
) {
  return this.columns[key];
}

function cols<T extends Variables>(this: Dataframe<T>) {
  return this.columns;
}

function row<T extends Variables>(
  this: Dataframe<T>,
  index: number,
  row?: RowOf<T>
) {
  row = row ?? ({} as RowOf<T>);
  for (const [k, v] of allEntries(this.columns)) {
    row[k] = v.valueAt(index) as VariableValue<typeof v>;
  }
  return row;
}

function rows<T extends Variables>(this: Dataframe<T>) {
  const n = this.n();
  const result = Array(n) as RowOf<T>[];
  for (let i = 0; i < n; i++) result[i] = this.row(i);

  return result;
}

function select<T extends Variables, U extends Partial<Variables>>(
  this: Dataframe<T>,
  selectfn: (cols: T) => U
): Dataframe<SymbolProps<T> & U> {
  const { columns } = this;
  const cols = cleanProps(selectfn(columns)) as any;

  for (const [k, v] of allEntries(columns)) {
    if (typeof k === "symbol") cols[k] = v;
  }

  const result = newDataframe(cols);
  this.listen(() => result.emit());
  return result;
}

function join<T extends Variables, U extends Variables>(
  this: Dataframe<T>,
  other: Dataframe<U>
) {
  const columns = { ...this.columns, ...other.columns };
  const result = newDataframe(columns) as Dataframe<Normalize<T & U>>;
  this.listen(() => result.emit());
  other.listen(() => result.emit());

  return result;
}

function proxy<T extends Variables>(this: Dataframe<T>, indices: number[]) {
  const columns = { ...this.columns };
  const copy = newDataframe(columns);
  copy.cachedN = () => indices.length;
  for (const [k, v] of allEntries(copy.columns)) {
    copy.columns[k] = (v as any).proxy(() => indices);
  }

  return copy;
}
