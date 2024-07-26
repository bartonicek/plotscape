export type MapFn<T> = (next: T) => T;
export type ReduceFn<T, U> = (prev: U, next: T) => U;

export type Reducer<T, U> = {
  name: string;
  initialfn: () => U;
  reducefn: ReduceFn<T, U>;
};

export type Stringable = { toString(): string };

export type Dataframe = Record<string | symbol, any[]>;

export enum Direction {
  Forwards = 1,
  Backwards = -1,
}

export type Margins = [
  bottom: number,
  left: number,
  top: number,
  right: number
];

export enum VAnchor {
  Middle = 1 / 2,
  Top = 1,
  Bottom = 0,
}

export enum HAnchor {
  Center = 1 / 2,
  Left = 1,
  Right = 0,
}

export enum MouseButton {
  Left = 0,
  Right = 2,
}
