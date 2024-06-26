import { Normalize, allEntries, allValues, cleanProps, values } from "utils";
import { Observable, observable } from "../mixins/Observable";
import { RowOf, SymbolProps, VariableValue, Variables } from "../types";
import { Variable } from "../variables/Variable";

/** Stores and provides access to variables. */
export interface Dataframe<T extends Variables = Variables> extends Observable {
  columns: T;
  clone(): Dataframe<T>;
  n(): number;
  keys(): string[];
  col<K extends keyof T>(key: K): T[K];
  cols(): T;
  colsArray(): Variable[];
  row(index: number, row?: RowOf<T>): RowOf<T>;
  rows(): RowOf<T>[];
  select<U extends Partial<Variables>>(
    selectfn: (cols: T) => U,
    options?: { keepSymbols?: boolean; keepQueryables?: boolean }
  ): Dataframe<SymbolProps<T> & U>;
  cachedN?(): number;
  join<U extends Variables>(other: Dataframe<U>): Dataframe<Normalize<T & U>>;
  proxy(indices: number[]): Dataframe<T>;
}

export function newDataframe<T extends Variables>(columns: T): Dataframe<T> {
  const tag = `Dataframe`;
  const props = { [Symbol.toStringTag]: tag, columns };
  const methods = {
    clone,
    n,
    keys,
    col,
    cols,
    colsArray,
    row,
    rows,
    select,
    join,
    proxy,
  };
  const self = { ...props, ...methods };

  return observable(self);
}

function clone<T extends Variables>(this: Dataframe<T>) {
  const cols = {} as any;
  for (const [k, v] of allEntries(this.columns)) cols[k] = v.clone();
  return newDataframe<T>(cols);
}

function n(this: Dataframe): number {
  for (const col of values(this.columns)) {
    if (col.n() != -1) return col.n();
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

function colsArray<T extends Variables>(this: Dataframe<T>) {
  return allValues(this.columns) as Variable[];
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

const defaultOpts = { keepSymbols: true, keepQueryables: true };

function select<T extends Variables, U extends Partial<Variables>>(
  this: Dataframe<T>,
  selectfn: (cols: T) => U,
  options?: { keepSymbols?: boolean; keepQueryables?: boolean }
): Dataframe<SymbolProps<T> & U> {
  const { columns } = this;
  const cols = cleanProps(selectfn(columns)) as any;
  const opts = Object.assign(defaultOpts, options);

  for (const [k, v] of allEntries(columns)) {
    if (
      (opts.keepSymbols && typeof k === "symbol") ||
      (opts.keepQueryables && v.isQueryable())
    )
      cols[k] = v;
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
