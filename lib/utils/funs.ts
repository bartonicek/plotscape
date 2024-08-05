import { defaultParameters } from "./defaultParameters";
import { Reactive } from "./Reactive";
import { EVENTTARGET } from "./symbols";
import {
  Entries,
  Flat,
  Indexable,
  Margins,
  Point,
  Primitive,
  Rect,
} from "./types";

/**
 * The identity function.
 * @param x A value
 * @returns The same value back
 */
export function identity<T>(x: T) {
  return x;
}

/**
 * Takes a value and returns it lazily.
 *
 * @param x Any value
 * @returns A function that always returns the original value
 */
export const just =
  <T>(x: T) =>
  () =>
    x;

/** Lazily returns the value 0. */
export const zero = just(0);

/** Lazily returns the value 1. */
export const one = just(1);

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
 * Calls a function/callback immediately
 *
 * @param fn A callback
 * @returns The return value of the callback
 */
export function call<T extends () => any>(fn: T) {
  return fn();
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
 * Computes the square root of a number. Exported from `Math`.
 * @param x A number
 * @returns The square root of the number
 */
export const sqrt = Math.sqrt;

/**
 * Computes the base-10 logarithm of a number
 *
 * @param x A number
 * @returns Its base-10 logarithm
 */
export const log10 = Math.log10;

/**
 * Computes 10 raised to the power of a number
 *
 * @param x A number (the exponent)
 * @returns Ten raised to the power of `x`
 */
export function exp10(x: number) {
  return 10 ** x;
}

/**
 * Computes the maximum of several numbers. Exported from `Math`.
 * @param values One or more numbers
 * @returns The highest number
 */
export const max = Math.max;

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
 * Truncates a number to a value between `min` and `max`.
 *
 * @param value A number
 * @param min Minimum (defaults to `0`)
 * @param max Maximum (defaults to `1`)
 * @returns Either `value`, `min`, or `max`
 */
export function trunc(value: number, min: number = 0, max: number = 1) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns the inverse of a range.
 * E.g. `rangeInverse(0.25, 0.75) === 2`.
 *
 * @param min Lower limit of the range
 * @param max Upper limit of the range
 * @returns The inverse range
 */
export function rangeInverse(min: number, max: number) {
  return 1 / (max - min);
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
 * @returns A tuple with limits of the new range
 */
export function invertRange(
  min: number,
  max: number,
): [min: number, max: number] {
  const ri = rangeInverse(min, max);
  return [-min * ri, ri - min * ri];
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
 * Compares two strings alphanumerically (i.e. `ABC2 < ABC20`). Used for sorting.
 * @param x An alphanumeric string
 * @param y Another alphanumeric string
 * @returns `1` if first greater, `-1` if second greater
 */
export function compareAlphaNumeric(x: string, y: string) {
  return x.localeCompare(y, "en", { numeric: true });
}

/**
 * Capitalizes a string.
 *
 * @param string A string
 * @returns A capitalized string
 */
export function capitalize<T extends string>(string: T) {
  return (string.charAt(0).toUpperCase() + string.slice(1)) as Capitalize<T>;
}

/**
 * Converts a function to lowercase (localized).
 *
 * @param string A string
 * @returns The lowercase version of the string
 */
export function toLowerCase(string: string) {
  return string.toLocaleLowerCase();
}

/**
 * Converts a function to uppercase (localized).
 *
 * @param string A string
 * @returns The uppercase version of the string
 */
export function toUpperCase(string: string) {
  return string.toLocaleUpperCase();
}

/**
 * Strips whitespace.
 * @param string A string
 * @returns The string without whitespace characters
 */
export function stripWS(string: string) {
  return string.replace(/\s/g, "");
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
export function subset<T>(
  array: T[],
  indices: number[],
  start = 0,
  end = indices.length,
) {
  const result = Array(end - start) as T[];

  for (let i = 0; i < end - start; i++) {
    result[i] = array[indices[start + i]];
  }

  return result;
}

/**
 * Find the minimum and maximum of an array.
 * @param array An array of numbers
 * @returns The tuple `[min, max]`
 */
export function minmax(array: number[]) {
  let [min, max] = [Infinity, -Infinity];
  for (let i = 0; i < array.length; i++) {
    min = Math.min(min, array[i]);
    max = Math.max(max, array[i]);
  }
  return [min, max] as [min: number, max: number];
}

/**
 * Computes a cumulative sum of the array of numbers.
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
  n: number = to - from,
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
 * Fetches a JSON object from path. Can error (in two ways).
 * @param path A file path
 * @returns A JSON object
 */
export async function fetchJSON(path: string) {
  return await (await fetch(path)).json();
}

/**
 * Merges two objects together
 * @param object1 An object
 * @param object2 Another object
 * @returns An object with properties of both (shallow copy)
 */
export function merge<
  T extends Record<string, any>,
  U extends Record<string, any>,
>(object1: T, object2: U): Flat<T & U> {
  return { ...object1, ...object2 };
}

/**
 * Copies values from one array to another, mutating in place (keeping the pointer the same but replacing everything)
 * @param source The source array
 * @param target The target array
 */
export function copyValues<T>(source: T[], target: T[]) {
  if (source === target) return;
  target.length = 0;
  for (let i = 0; i < source.length; i++) target.push(source[i]);
}

/**
 * Copies properties from one object to another, mutating in place
 * @param source The source object
 * @param target The target object
 */
export function copyProps<T extends Record<string, any>>(source: T, target: T) {
  for (const [k, v] of Object.entries(source) as Entries<T>) {
    if (isArray(v) && isArray(source[k])) copyValues(v, source[k]);
    else target[k] = v;
  }
}

/**
 * Applies direction to a value within [0, 1].
 * @param x A number within [0, 1]
 * @param direction A direction indicated by 1 or -1
 * @returns Returns just `x` if `direction` is 1. Otherwise returns `1 - x`.
 */
export function applyDirection(x: number, direction: 1 | -1) {
  return 0.5 * (1 - direction) + direction * x;
}

/**
 * Finds a set of "pretty" breaks within the range specified by [min, max].
 * @param min The lower limit of the range
 * @param max The upper limit of the range
 * @param n Number of breaks (approximate)
 * @returns An array of breaks (number)
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

/**
 * Computes breaks of a histogram based on an array.
 * @param array An array of numbers
 * @param options A list of options related to the histogram binning
 * @returns An array of breaks
 */
export function binBreaks(
  array: number[],
  options?: { width?: number; anchor?: number; nBins?: number },
) {
  let { width, anchor, nBins } = options || {};
  const [min, max] = minmax(array);
  const range = max - min;

  nBins = nBins ?? (width ? Math.ceil(range / width) + 1 : 10);
  width = width ?? range / (nBins - 1);
  anchor = anchor ?? min;

  const breakMin = min - width + ((anchor - min) % width);
  const breakMax = max + width - ((max - anchor) % width);

  const breaks = Array<number>(nBins + 2);
  breaks[0] = breakMin;
  breaks[breaks.length - 1] = breakMax;

  for (let i = 1; i < breaks.length - 1; i++) {
    breaks[i] = breakMin + i * width;
  }

  return breaks;
}

/**
 * Get margins by multiplying the number of lines by the font size.
 * @returns An array of margins in pixels
 */
export function getMargins() {
  const { marginLines, axisTitleFontsize } = defaultParameters;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return marginLines.map((x) => x * rem * axisTitleFontsize) as Margins;
}

/**
 * Adds a list of tailwind classes to an HTML element.
 * @param element An HTML element
 * @param classList A list of tailwind classes (strings)
 */
export function addTailwind(element: HTMLElement, classList: string) {
  for (const c of classList.split(" ")) element.classList.add(c);
}

/**
 * Removes a list of tailwind classes from an HTML element.
 * @param element An HTML element
 * @param classList A list of tailwind classes (strings)
 */

export function removeTailwind(element: HTMLElement, classList: string) {
  for (const c of classList.split(" ")) element.classList.remove(c);
}

/**
 * Throttles a function such that it can only be called once within a specified time-window.
 *
 * @param fn A function
 * @param period Time-window in ms
 * @returns A version of the function that only fires once within each time-window
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  period: number,
) {
  let lastTime = 0;
  return function (...args: Parameters<T>) {
    const now = new Date().getTime();
    if (now - lastTime < period) return;
    lastTime = now;
    fn(...args);
  };
}

/**
 * Time the execution of a callback.
 * @param callbackfn A callback function that takes no arguments
 * @returns The time it took to run the callback
 */
export function timeExecution(callbackfn: () => void) {
  const t1 = performance.now();
  callbackfn();
  const t2 = performance.now();
  return t2 - t1;
}

export function makeDispatchFn<T extends Reactive, E extends string>() {
  return function (object: T, type: E, data?: Record<string, any>) {
    object[EVENTTARGET].dispatchEvent(new CustomEvent(type, { detail: data }));
  };
}

export function makeListenFn<T extends Reactive, E extends string>() {
  return function (
    object: T,
    type: E,
    eventfn: (event: CustomEvent) => void,
    options?: { throttle?: number },
  ) {
    if (options?.throttle) eventfn = throttle(eventfn, options.throttle);
    object[EVENTTARGET].addEventListener(type, eventfn as EventListener);
  };
}

export function makeGetter<T>(indexable: Indexable<T>): (index: number) => T {
  if (isArray(indexable)) return (index: number) => indexable[index];
  else if (typeof indexable === "function") {
    return indexable as (index: number) => T;
  }
  return () => indexable;
}

/**
 * Checks whether a point is inside a rectangle.
 * @param point A points (`[x, y]`)
 * @param rect A rectangle (`[x0, y0, x1, y1]`)
 * @returns `true` if the point is inside the rectangle
 */
export function pointInRect(point: Point, rect: Rect) {
  const [x, y] = point;
  const [x0, y0, x1, y1] = rect;

  return !(x < x0 || x > x1 || y < y0 || y > y1);
}

/**
 * Checks whether two rectangles intersect.
 * @param rect1 One rectangle specified by a list of corner coordinates: [x0, y0, x1, y1]
 * @param rect2 Another rectangle
 * @returns `true` if the rectangles intersect, false otherwise
 */
export function rectsIntersect(rect1: Rect, rect2: Rect) {
  const [r1xmin, r1xmax] = [rect1[0], rect1[2]].sort(diff);
  const [r1ymin, r1ymax] = [rect1[1], rect1[3]].sort(diff);
  const [r2xmin, r2xmax] = [rect2[0], rect2[2]].sort(diff);
  const [r2ymin, r2ymax] = [rect2[1], rect2[3]].sort(diff);

  return !(
    r1xmax < r2xmin || // If any holds, rectangles don't overlap
    r1xmin > r2xmax ||
    r1ymax < r2ymin ||
    r1ymin > r2ymax
  );
}

/**
 * Adds a property to an indexed dictionary. E.g. `addIndexed({ foo1: 420 }, "foo", 69)` returns
 * `{ foo1: 420, foo2: 69 }`
 *
 * @param object An object with properties which may be indexed
 * @param key A string
 * @param value Any value
 * @returns Nothing (mutates the object in place)
 */
export function addIndexed(
  object: Record<string, any>,
  key: string,
  value: any,
) {
  const keys = Object.keys(object);
  const matching = keys.filter((x) => x.replace(/[0-9]*$/, "") === key);
  if (matching.length === 0) {
    object[`${key}1`] = value;
    return;
  }

  const counts = matching.map((x) => parseInt(x.match(/[0-9]*$/)![0], 10));
  const count = Math.max(...counts);
  object[`${key}${count + 1}`] = value;
}

export function formatLabel(label: number | string) {
  if (typeof label != "number") return label;

  if (label === 0) return label.toString();

  const base = Math.floor(Math.log10(Math.abs(label)));
  if (base > 4) return round(label).toString();
  if (base <= 4 && base > 0) return round(label, 4 - base).toString();
  else return round(label, Math.abs(base) + 2).toString();
}

/**
 * Format plot labels - returns the labels back if they're an array of strings,
 * otherwise rounds numeric labels and converts them to exponential if too big.
 * @param labels An array of strings or numbers
 * @param options A list of options
 * @returns A formated array of labels
 */
export function formatLabels(
  labels: number[] | string[],
  options?: { decimalPlaces?: number },
): string[] {
  if (!isNumberArray(labels)) return labels;

  const dec = options?.decimalPlaces ?? 4;
  const shouldFormat = (x: number) => x != 0 && Math.abs(Math.log10(x)) > dec;

  // Use superscript if any number is sufficiently small or sufficiently big
  const useSuperscript = minmax(labels).some(shouldFormat);
  const formatFn = useSuperscript ? superscriptFn : noSuperscriptFn;
  return labels.map(formatFn);
}

function superscriptFn(x: number) {
  if (x === 0) return `0`;
  return exponentialToSuperscript(x.toExponential());
}

function noSuperscriptFn(x: number) {
  // Parsing to avoid floating-point precision formatting errors
  if (x === 0) return `0`;
  return parseFloat(x.toPrecision(12)).toString();
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
 * Converts a string representation of a number to its superscript representation (unicode).
 *
 * @param n A number represented as a string
 * @returns The same number as superscript
 */
export function convertToSuperscript(n: string) {
  return n
    .split("")
    .map((x) => sups[x])
    .join("");
}

const primitives = [`string`, `number`, `boolean`, `undefined`];

/**
 * Checks whether a value is primitive
 * @param value A value
 * @returns `true` if the value is primitive
 */
export function isPrimitive(value: any): value is Primitive {
  return value === null || primitives.includes(typeof value);
}

/**
 * Checks whether an object is an array. Exported from `Array`.
 */
export const isArray = Array.isArray;

/**
 * Checks whether an array is an array of numbers (by checking the first value only)
 * @param array An array
 * @returns `true` if the first element is a number
 */
export function isNumberArray(array: any[]): array is number[] {
  return typeof array[0] === "number";
}

/**
 * Finds the length across a list of `Indexable`s. The function just loops
 * through the list, until it finds an an array and then it returns its length.
 * If it doesn't find one (all indexables are functions), then it throws an error.
 * @param indexables An array of indexables
 * @returns A `number` (or throws)
 */
export function findLength(indexables: (Indexable | undefined)[]) {
  let n: number | undefined = undefined;
  for (const indexable of indexables) {
    if (Array.isArray(indexable)) n = indexable.length;
    break;
  }

  const msg = `At least one variable needs to be of fixed length`;
  if (!n) throw new Error(msg);

  return n;
}
