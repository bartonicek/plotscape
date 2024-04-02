import { MapFn, Normalize } from "./types";

/**
 * Throws a new error.
 *
 * @param description A description of the error
 */
export function error(description: string) {
  throw new Error(description);
}

/**
 * Takes any value and returns it.
 *
 * @param x Any value
 * @returns The same value
 */
export function identity<T>(x: T) {
  return x;
}

/**
 * Takes a value and returns it lazily.
 *
 * @param x Any value
 * @returns A function that returns the original value
 */
export const just =
  <T>(x: T) =>
  () =>
    x;

/**
 * Calls a function/callback immediately
 *
 * @param fn A callback
 * @returns The return value of the callback
 */
export function call<T extends () => any>(fn: T) {
  return fn();
}

/**
 * Creates a function that calls a method by key when given an object with the method.
 * The method should accept no parameters. Useful for e.g. `[{ foo: () => number }].map(callMethod('foo'))`
 *
 * @param key Key of the method
 * @returns Returntype of the method
 */
export function callMethod<K extends string, U>(key: K) {
  return function (object: { [key in K]: () => U }) {
    return object[key]();
  };
}

/**
 * Takes in any number of arguments and returns the first one.
 *
 * @param x The first argument
 * @param rest Rest of the arguments
 * @returns The first argument
 */
export function firstArgument<T>(x: T, ..._rest: any[]) {
  return x;
}

/**
 * Takes in any number of arguments and returns the second one.
 *
 * @param _ The first argument
 * @param y The second argument
 * @param rest Rest of the arguments
 * @returns The second argument
 */
export function secondArgument<T>(_: any, y: T, ..._rest: any[]) {
  return y;
}

/**
 * Composes two functions.
 *
 * @param fn1 The first function
 * @param fn2 The second function
 * @returns A function that takes in the first's input and
 * produces the second's output.
 */
export function compose<T, U, V>(fn1: MapFn<T, U>, fn2: MapFn<U, V>) {
  return function (x: T) {
    return fn2(fn1(x));
  };
}

/**
 * Takes in two functions and returns a new function that calls both in order.
 *
 * @param fn1 A function
 * @param fn2 Another function
 * @returns A new function.
 */
export function inOrder(
  fn1: (...args: any) => any,
  fn2: (...args: any) => any
) {
  return function (...args: any[]) {
    fn1(args);
    fn2(args);
  };
}

/**
 * Takes a function that takes a variable number of arguments
 * and returns a version of that function that only takes
 * in the first argument.
 *
 * @param fn A function
 * @returns A unary function
 */
export function unary<T extends (...args: any[]) => any>(fn: T) {
  return function (arg: Parameters<T>[0]): ReturnType<T> {
    return fn(arg);
  };
}

/** Lazily returns the value 0. */
export const zero = just(0);

/** Lazily returns the value 1. */
export const one = just(1);

/** Lazily returns a Plain Old JavaScript Object. */
export const POJO = just({});

/** Does nothing. */
export function noop() {}

/**
 * Returns `this` without doing anything else.
 *
 * @param this Any context
 * @returns The context back
 */
export function noopThis<T>(this: T) {
  return this;
}

/**
 * Increments a number by 1.
 *
 * @param x A number
 * @returns The number plus one
 */
export function inc(x: number) {
  return x + 1;
}

/**
 * Decrements a number by 1.
 *
 * @param x A number
 * @returns The number minus one.
 */
export function dec(x: number) {
  return x - 1;
}

/**
 * Returns a function that multiplies numbers by `x`.
 * @param x The multiplier
 * @returns A function that multiplies numbers by the multiplier
 */
export function times(x: number) {
  return function (y: number) {
    return x * y;
  };
}

/**
 * Computes the square of a number.
 *
 * @param x A number
 * @returns The number squared
 */
export function square(x: number) {
  return x ** 2;
}

/**
 * Computes the square root of a number
 * @param x A number
 * @returns The square root of the number
 */
export function squareRoot(x: number) {
  return Math.sqrt(x);
}

/**
 * Returns the string representation of the supplied object.
 *
 * @param x Object with a `toString()` method
 * @returns The string representation
 */
export function asString(x: { toString(): string }) {
  return x.toString();
}

/**
 * Parses an integer from string.
 *
 * @param x A string
 * @returns A number (integer)
 */
export function asInt(x: string) {
  return parseInt(x, 10);
}

/**
 * Capitalizes a string.
 *
 * @param string A string
 * @returns A capitalized string
 */
export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Converts a function to lowercase (localized)
 *
 * @param string A string
 * @returns The lowercase version of the string
 */
export function toLowerCase(string: string) {
  return string.toLocaleLowerCase();
}

/**
 * Converts a function to uppercase (localized)
 *
 * @param string A string
 * @returns The uppercase version of the string
 */
export function toUpperCase(string: string) {
  return string.toLocaleUpperCase();
}

export function stripWhitespace(string: string) {
  return string.replace(/\s/g, "");
}

/**
 * Makes a fetch request and awaits the resulting JSON.
 * Will throw if there is no file at the specified path or
 * if the response cannot be parsed.
 *
 * @param path A string URL or a path to a local file
 * @returns An object (JSON)
 */
export async function fetchJSON(path: string): Promise<unknown> {
  return await (await fetch(path)).json();
}

/**
 * Computes the difference between two numbers.
 *
 * @param x A number
 * @param y Another number
 * @returns A difference between the two numbers
 */
export function diff(x: number, y: number) {
  return x - y;
}

/**
 * Computes the sum of two numbers.
 *
 * @param x A number
 * @param y Another number
 * @returns A sum of the two numbers
 */
export function sum(x: number, y: number) {
  return x + y;
}

/**
 * Computes the product of two numbers.
 *
 * @param x A number
 * @param y Another number
 * @returns A product of the two numbers
 */
export function prod(x: number, y: number) {
  return x * y;
}

/**
 * Compares two strings alphanumerically (i.e. `ABC2 < ABC20`). Used for sorting.
 * @param x An alphanumeric string
 * @param y Another alphanumeric string
 * @returns `1` if first greater, `-1` if second greater
 */
export function compareAlphaNumeric(x: string, y: string) {
  return x.localeCompare(y, "en", { numeric: true });
}

/**
 * Truncates a number to a value between `min` and `max`.
 *
 * @param value A number
 * @param min Minimum
 * @param max Maximum
 * @returns Either `value`, `min`, or `max`
 */
export function trunc(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncates a number to a value between 0 and 1.
 *
 * @param value A number
 * @returns Either `value`, 0, or 1.
 */
export function trunc0to1(value: number) {
  return trunc(value, 0, 1);
}

/**
 * Rounds a number to `n` decimal places.
 *
 * @param value Number to round
 * @param places The number of decimal places
 * @returns The number rounded to `n` decimal places
 */
export function round(value: number, places = 0) {
  return Math.round(value * 10 ** places) / 10 ** places;
}

/**
 * Returns the last element of an array.
 * @param array An arbitrary array
 * @returns The last element
 */
export function last<T>(array: T[]) {
  return array[array.length - 1];
}

/**
 * Returns an ascending/descending sequence of numbers. If `length` is unspecified
 * and `start` and `end` are integers, will return a sequence of integers.
 *
 * @param start Start of the sequence.
 * @param end End of the sequence.
 * @param length Length of the sequence (optional)
 * @returns
 */
export function seq(start: number, end: number, length?: number) {
  const range = Math.abs(end - start);
  length = length ?? Math.ceil(range) + 1;
  const inc = range / (length - 1);
  const sign = end >= start ? 1 : -1;
  return Array.from(Array(length), (_, i) => start + sign * inc * i);
}

/**
 * Finds the minimum and the maximum of an array, in one pass through the data.
 *
 * @param x An array of numbers.
 * @returns A tuple of the minimum and the maximum
 */
export function minMax(x: number[]): [number, number] {
  let [min, max] = [Infinity, -Infinity];
  for (let i = 0; i < x.length; i++) {
    min = Math.min(min, x[i]);
    max = Math.max(max, x[i]);
  }
  return [min, max];
}

/**
 * Repeats a value `n` times
 *
 * @param value The value to repeat
 * @param n The number of times to repeat
 * @returns An array of length `n` filled with the value
 */
export function rep<T>(value: T, n: number) {
  return Array(n).fill(value);
}

/**
 * Subsets an array on an array of indices. Can specify start and
 * end to subset on a shorter slice of the index array.
 *
 * @param array An array of type `T`
 * @param indices An array of indices
 * @param start The position of the start index (defaults to 0)
 * @param end The position of th end index (defaults to `indices.length`)
 * @returns A new array of type `T`, ordered based on the indices
 */
export function subsetOnIndices<T>(
  array: T[],
  indices: number[],
  start = 0,
  end = indices.length
) {
  const result = Array(end - start) as T[];

  for (let i = 0; i < end - start; i++) {
    result[i] = array[indices[start + i]];
  }

  return result;
}

/**
 * Maps multiple functions over an array and concatenates the results
 *
 * @param array An array
 * @param mapfns A number of map functions (variadic)
 * @returns An array of length `array.length * mapfns.length`
 */
export function mapParallel<T, U>(array: T[], ...mapfns: ((next: T) => U)[]) {
  const result = Array(array.length * mapfns.length) as U[];

  for (let j = 0; j < mapfns.length; j++) {
    const mapfn = mapfns[j];
    for (let i = 0; i < array.length; i++) {
      result[array.length * j + i] = mapfn(array[i]);
    }
  }

  return result;
}

/**
 * Samples a random integer from within the pre-specified interval
 *
 * @param from Start of the interval (inclusive)
 * @param to End of the interval (exclusive)
 * @returns An integer within [`start`, `end`)
 */
export function randomInteger(from: number, to: number) {
  return Math.floor(from + Math.random() * to);
}

/**
 * Samples `n` integers from within the (`from`, `to`] interval
 *
 * @param from Start of the interval (inclusive)
 * @param to End of the interval (exclusive)
 * @param n Number of integers to sample
 * @returns An array of integers in the interval
 */
export function uniqueIntegers(
  from: number,
  to: number,
  n: number = to - from
) {
  const length = to - from;
  const sampled = [] as number[];
  const usedIndices = new Set<number>();

  while (sampled.length < Math.min(n, length)) {
    let integer = randomInteger(from, to);
    while (usedIndices.has(integer)) integer = randomInteger(from, to);
    sampled.push(integer);
    usedIndices.add(integer);
  }

  return sampled;
}

/**
 * Computes a cumulative sum of the array of numbers
 *
 * @param array An array of numbers
 * @returns A array of equal length as the input
 */
export function cumsum(array: number[]) {
  const result = Array(array.length);
  result[0] = array[0];

  for (let i = 1; i < array.length; i++) {
    result[i] = array[i] + result[i - 1];
  }

  return result;
}

/**
 * Returns typed keys of an object.
 *
 * @param object An object
 * @returns A typed array of keys
 */
export function keys<T extends Record<PropertyKey, unknown>>(object: T) {
  return Object.keys(object) as (keyof T)[];
}

/**
 * Returns typed values of an object
 *
 *
 * @param object An object
 * @returns A typed array of values
 */
export function values<T extends Record<PropertyKey, unknown>>(object: T) {
  return Object.values(object) as T[keyof T][];
}

/**
 * Returns typed entries of an object
 *
 *
 * @param object An object
 * @returns A typed array of entries (key/value pairs)
 */
export function entries<T extends Record<PropertyKey, unknown>>(object: T) {
  return Object.entries(object) as {
    [key in keyof T]: [key, T[key]];
  }[keyof T][];
}

/**
 * Returns typed keys of an object, including symbols.
 *
 * @param object An object
 * @returns A typed array of keys
 */
export function allKeys<T extends Record<PropertyKey, unknown>>(object: T) {
  return Reflect.ownKeys(object) as (keyof T)[];
}

/**
 * Returns typed values of an object, including values of symbol-based keys.
 *
 * @param object An object
 * @returns A typed array of values
 */
export function allValues<T extends Record<PropertyKey, unknown>>(object: T) {
  const result = [] as { [key in keyof T]: T[key] }[keyof T][];
  for (const k of allKeys(object)) result.push(object[k]);
  return result;
}

/**
 * Returns typed entries of an object, including symbols and their respective values.
 *
 * @param object An object
 * @returns A typed array of entries (key/value pairs)
 */
export function allEntries<T extends Record<PropertyKey, unknown>>(object: T) {
  const result = [] as { [key in keyof T]: [key, T[key]] }[keyof T][];
  for (const k of allKeys(object)) result.push([k, object[k]]);
  return result;
}

export function cleanProps<T extends Record<PropertyKey, unknown>>(object: T) {
  for (const [k, v] of entries(object)) {
    if (v === undefined) delete object[k];
  }
  return object;
}

/**
 * Throttles a function such that it can only be called once within a specified time-window.
 *
 * @param fn A function
 * @param period Time-window in ms
 * @returns A version of the function that only fires once within each time-window
 */
export function throttle(fn: Function, period: number) {
  let lastTime = 0;
  return (...args: any[]) => {
    const now = new Date().getTime();
    if (now - lastTime < period) return;
    lastTime = now;
    fn(...args);
  };
}

/**
 * Merge values from one set into another.
 *
 * @param target Target set
 * @param source Source set
 * @returns The target set with values merged
 */
export function mergeInto<T>(target: Set<T>, source: Set<T>) {
  for (const v of source) target.add(v);
  return target;
}

/**
 * Inverts numerical range defined by its limits and returns new limits
 * such that scaling 0 and 1 will return the original limits.
 * I.e. if we define a scaling function:
 * `const scale = (value) => (value - newMin) / (newMax - newMin)`),
 * then `scale(0) === min` and `scale(1) === max`.
 *
 * @param min Lower limit of the range
 * @param max Upper limit of the range
 * @returns A tuple with limits of the new range and a scale factor
 */
export function invertRange(
  min: number,
  max: number
): [min: number, max: number, scaleFactor: number] {
  const rangeInverse = 1 / (max - min);
  return [-min * rangeInverse, rangeInverse - min * rangeInverse, rangeInverse];
}

/**
 * An algorithm to compute "pretty" breaks (i.e. ones defined by
 * multiples of neat values, 1, 2, 5, or 10)
 * from a given numerical range. Inspired by the `pretty()` function from base R.
 *
 * @param min Lower limit of the range
 * @param max Upper limit of the range
 * @param n Number of breaks (optional, used only as a rough guide)
 * @returns An array of pretty break points within the range.
 * The lower and upper limits of the pretty breaks may be different
 * (but within) the original range and their number may be different from `n`.
 */
export function prettyBreaks(min: number, max: number, n = 4) {
  const unitGross = (max - min) / n;
  const base = Math.floor(Math.log10(unitGross));

  const neatUnits = [1, 2, 4, 5, 10];
  let [minDist, neatValue] = [Infinity, 0];

  // Find the nearest neat unit to the gross unit
  for (let i = 0; i < neatUnits.length; i++) {
    const dist = (neatUnits[i] * 10 ** base - unitGross) ** 2;
    if (dist < minDist) [minDist, neatValue] = [dist, neatUnits[i]];
  }

  const unitNeat = 10 ** base * neatValue;

  const minNeat = Math.ceil(min / unitNeat) * unitNeat;
  const maxNeat = Math.floor(max / unitNeat) * unitNeat;

  const newN = Math.round((maxNeat - minNeat) / unitNeat);
  const breaks = [] as number[];

  for (let i = 0; i < newN + 1; i++) {
    const value = minNeat + i * unitNeat;
    breaks.push(value);
  }

  return breaks;
}

const sups: Record<string, string> = {
  "-": "⁻",
  "+": "",
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
};

/**
 * Create an accessor function bound to a specific object
 * @param object An object/dictionary
 * @returns A function which takes in keys of the object and returns corresponding values
 */
function accessor<T extends Record<PropertyKey, any>>(object: T) {
  return function (key: keyof T) {
    return object[key];
  };
}

/**
 * Copies the properties from the source object to the receiver object by key
 *
 * @param source The source object
 * @param target The receiver object
 * @param keys Keys of the of the source object to copy
 * @returns The second object, with the properties copied
 */
export function copyProperties<
  T extends Record<PropertyKey, any>,
  U extends Record<PropertyKey, any>
>(source: T, target: U, keys: (keyof T)[]) {
  for (const k of keys) target[k] = source[k];
  return target as Normalize<T & U>;
}

/**
 * Converts a string representation of a number to its superscript representation (unicode).
 *
 * @param n A number represented as a string
 * @returns The same number as superscript
 */
export function convertToSuperscript(n: string) {
  return n.split("").map(accessor(sups)).join("");
}

/**
 * Turns a number in exponential/scientific notation (e.g. `1.2+e4`)
 * to its superscript-formatted equivalent (`1.2×10³⁴`).
 *
 * @param n A string of a number in scientific notation
 * @returns A string in superscript-based format
 */
export function exponentialToSuperscript(n: string) {
  let [base, exponent] = n.split("e");
  exponent = convertToSuperscript(exponent);
  return base + "×10" + exponent;
}

/**
 * Clears all children from an Element.
 *
 * @param element An element
 * @returns The element back
 */
export function clearChildren(element: Element) {
  while (element.lastChild) element.removeChild(element.lastChild);
  return element;
}
