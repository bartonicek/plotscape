import * as utils from "utils";
import { allValues, error, subsetOnIndices, uniqueIntegers } from "utils";
import { RowOf, VariableValue, Variables } from "../types";
import { ColumnParser, ParsedColumns } from "./ColumnParser";

export interface Dataframe<T extends Variables = Variables> {
  columns: T;
  n(): number;
  keys(): (keyof T)[];
  col<K extends keyof T>(key: K): T[K];
  cols(): T;
  row(index: number, row?: RowOf<T>): RowOf<T>;
  rows(): RowOf<T>[];
  select<U extends Variables>(selectfn: (cols: T) => U): Dataframe<U>;
  cachedN?(): number;
}

export function newDataframe<T extends Variables>(columns: T): Dataframe<T> {
  return { columns, n, keys, col, cols, row, rows, select };
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
    columns[k] = variable;
  }

  return data;
}

function n(this: Dataframe): number {
  if (this.cachedN) return this.cachedN();
  for (const col of allValues(this.columns)) {
    if (col.n) {
      this.cachedN = col.n.bind(col);
      return this.cachedN!();
    }
  }
  throw new Error(`No fixed-length variables present in the data`);
}

function keys<T extends Variables>(this: Dataframe<T>) {
  return utils.keys(this.columns);
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
  for (const [k, v] of utils.allEntries(this.columns)) {
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

function select<T extends Variables, U extends Variables>(
  this: Dataframe<T>,
  selectfn: (cols: T) => U
) {
  return newDataframe(selectfn(this.columns));
}
