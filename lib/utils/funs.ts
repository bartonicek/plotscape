import { Getter } from "./Getter";
import { Meta } from "./Meta";
import {
  Dataframe,
  Entries,
  Flat,
  Indexable,
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
 * Returns the last value in an array.
 * @param array An array
 * @returns The last value
 */
export function last<T>(array: T[]) {
  return array[array.length - 1];
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
 * Subsets an array on an array of indices such that the ith
 * element of the result is `array[indices[i]]`.
 *
 * @param array An array of type `T`
 * @param indices An array of indices
 * @returns A new array of the same length as `indices`
 */
export function subset<T>(array: T[], indices: number[]) {
  const result = Array(indices.length) as T[];

  for (let i = 0; i < indices.length; i++) {
    result[i] = array[indices[i]];
  }

  return result;
}

/**
 * Removes an element from an array (mutating in-place)
 * @param array An array of values
 * @param value A value in the array
 */
export function remove<T>(array: T[], value: T) {
  const index = array.indexOf(value);
  if (index !== -1) array.splice(index, 1);
}

/**
 * Returns a copy of the array ordered by the indices. Similar to
 * `subset`, however, instead of ith element of the result being
 * `array[indices[i]]`, it is instead the case that `result[indices[i]]`
 * is `array[i]`.
 *
 * @param array An array of values
 * @param indices An array of indices
 * @returns A new array of the same length as `indices`
 */
export function ordered<T>(array: T[], indices: number[]) {
  const result = Array<T>(indices.length);
  for (let i = 0; i < indices.length; i++) result[indices[i]] = array[i];
  return result;
}

/**
 * Returns order indices of a numeric array, i.e.
 * for each value it computes the index the value would
 * be if the array was sorted. Breaks ties in order.
 *
 * @param array A numeric array
 * @returns An array of indices
 */
export function orderIndices(array: number[]) {
  const sorted = array.toSorted(diff);

  const result = {} as Record<number, number>;
  const seen = {} as Record<number, number>;

  for (let i = 0; i < sorted.length; i++) {
    const value = array[i];
    seen[value] = seen[value] + 1 || 0;
    result[i] = sorted.indexOf(value) + seen[value];
  }

  return Object.values(result);
}

/**
 * Orders an array by an array of indicies, mutating in place.
 *
 * @param array An array
 * @param indices An array of indices
 */
export function orderBy(array: unknown[], indices: number[]) {
  const temp = Array(array.length);
  for (let i = 0; i < array.length; i++) temp[i] = array[indices[i]];
  for (let i = 0; i < array.length; i++) array[i] = temp[i];
}

/**
 * Returns order indices based on a table of values, i.e.
 * iterates through an array and for each value, returns the
 * index that value takes in the table. The array can have repeated
 * values, and the table can have some unique values
 * that are not represented in the array.
 *
 * @param array An array of values
 * @param table An array of values of the same type
 * @returns
 */
export function orderIndicesByTable<T>(array: T[], table: T[]) {
  const result = Array(array.length);

  for (let i = 0; i < array.length; i++) {
    result[i] = table.indexOf(array[i]);
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

export function makeGetter<T>(indexable: Indexable<T>): (index: number) => T {
  if (typeof indexable === `function`) return indexable;
  else if (isArray(indexable)) return (index: number) => indexable[index];
  else return () => indexable;
}

type Segment = Rect;
function segmentToPointVec(segment: Segment) {
  const [x0, y0, x1, y1] = segment;
  return [x0, y0, x1 - x0, y1 - y0];
}

function inRange(value: number, min: number, max: number) {
  return !(value < min) && !(value > max);
}

/**
 * Checks whether two segments intersect
 * @param segment1 A segment (define as: `[x0, y0, x1, y1]`)
 * @param segment2 Another segment
 * @returns Whether the two segments intersect
 */
export function segmentsIntersect(segment1: Segment, segment2: Segment) {
  let [s1x0, s1y0, s1x1, s1y1] = segmentToPointVec(segment1);
  let [s2x0, s2y0, s2x1, s2y1] = segmentToPointVec(segment2);

  const det = s2x1 * s1y1 - s1x1 * s2y1;
  const s = ((s1x0 - s2x0) * s1y1 - (s1y0 - s2y0) * s1x1) / det;
  const t = -(-(s1x0 - s2x0) * s2y1 + (s1y0 - s2y0) * s2x1) / det;

  return inRange(s, 0, 1) && inRange(t, 0, 1);
}

/**
 * Checks whether a segment intersects a rectangle
 * @param rect A rectangle
 * @param segment A segment
 * @returns `true` if the segment does intersect the rectangle
 */
export function rectSegmentIntersect(rect: Rect, segment: Segment) {
  const [x0, y0, x1, y1] = rect;
  return (
    segmentsIntersect([x0, y0, x1, y0], segment) ||
    segmentsIntersect([x0, y0, x0, y1], segment) ||
    segmentsIntersect([x1, y0, x1, y1], segment) ||
    segmentsIntersect([x0, y1, x1, y1], segment)
  );
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

export function minDecimal(array: number[]) {
  let min = Infinity;
  for (let i = 0; i < array.length; i++) {
    if (array[i] === 0) continue;
    min = Math.min(min, Math.log10(Math.abs(array[i])));
  }
  if (min > 3) return 0;
  return Math.floor(Math.abs(min)) + 2;
}

export function formatText(
  value: string,
  options = { lowercase: true, capitalize: true, split: true },
) {
  if (options?.split) value = value.replace(/_/g, ` `);
  if (options?.lowercase) value = value.toLocaleLowerCase();
  if (options?.capitalize) value = capitalize(value);

  return value;
}

/**
 * Formats a single label.
 * @param label A string or number
 * @returns The label, formatted
 */
export function formatLabel(label: number | string) {
  if (typeof label === `string`) return label;
  if (label === 0) return label.toString();

  const base = Math.floor(Math.log10(Math.abs(label)));

  // >= 1000, round to whole numbers
  if (base >= 3) return round(label).toString(); //
  // <= 0.001: round to 2 significant
  if (base <= -3) return round(label, -base + 1).toString();
  // Otherwise round to two decimal places
  else return round(label, 2).toString();
}

/**
 * Format axis labels: returns the labels back if they're strings,
 * otherwise rounds numeric labels and converts to exponential form if too big.
 *
 * @param labels An array of strings or numbers
 * @param options A list of options
 * @returns A formated array of labels
 */
export function formatAxisLabels(
  labels: number[] | string[],
  options?: { tens?: number; decimals?: number },
): string[] {
  if (!isNumberArray(labels)) return labels;

  const dec = options?.tens ?? 4;
  const shouldFormat = (x: number) => x != 0 && Math.abs(Math.log10(x)) > dec;

  const mindec = options?.decimals ?? minDecimal(labels);
  labels = labels.map((x) => round(x, mindec));

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

export function isNumber(x: any): x is number {
  return typeof x === `number`;
}

export function isIntegerString(x: string) {
  return /^[0-9]+/.test(x);
}

/**
 * Checks whether an array is an array of numbers
 * (by checking the first and last values only).
 *
 * @param array An array
 * @returns `true` if the first and last element is a number
 */
export function isNumberArray(array: any[]): array is number[] {
  return typeof array[0] === `number` && typeof last(array) === `number`;
}

/**
 * Checks whether an array is an array of strings
 * (by checking the first and last values only).
 *
 * @param array An array
 * @returns `true` if the first and last element is a number
 */
export function isStringArray(array: any[]): array is string[] {
  return typeof array[0] === `string` && typeof last(array) === `string`;
}

/**
 * Finds the length across a list of `Indexable`s. The function just loops
 * through the list, until it finds an an array and then it returns its length.
 * If it doesn't find one (all indexables are functions), then it throws an error.
 * @param indexables An array of indexables
 * @returns A `number` (or throws)
 */
export function findLength(indexables: (Indexable | undefined)[]) {
  for (const indexable of indexables) {
    if (!indexable) continue;
    const length = Meta.get(indexable, `length`);
    if (length) return length;
  }

  const msg = `At least one variable needs to be of fixed length`;
  throw new Error(msg);
}
export function applyWith<T>(...values: T[]) {
  return function <U>(fn: (...values: T[]) => U) {
    return fn(...values);
  };
}

/**
 * Returns a 'row' of a dataframe (struct of arrays).
 *
 * @param data A dictionary with values being arrays of same length
 * @param index An index representing the row
 * @returns An object with the same keys as `data` and scalar values
 */
export function row<T extends Dataframe>(data: T, index: number) {
  const result = {} as any;

  for (const [k, v] of Object.entries(data)) {
    result[k] = Getter.of(v)(index);
  }
  return result;
}

export function selector<K extends string>(key: K) {
  return function (object: Record<string, any> & { [key in K]: any }) {
    return object[key];
  };
}

/**
 * Takes in an array of keys and returns a selector function that,
 * given an object, extract the values of those keys and
 * returns them as array.
 *
 * @param keys An array of keys
 * @returns A selector function
 */
export function keysToSelectors<K extends string>(keys: K[]) {
  return function <T extends Record<K, any>>(object: T) {
    return keys.map((x) => object[x]);
  };
}

/**
 * Splits a string with numeric suffix into the suffix and non-suffix part.
 * @param x A string which includes a numeric suffix
 * @returns A tuple of the suffix and the rest of the string
 */
export function splitNumericSuffix(x: string) {
  let index = x.length - 1;

  while (index > 0) {
    if (!/[0-9]/.test(x[index])) break;
    index--;
  }

  index += 1;
  return [x.substring(0, index), x.substring(index, x.length)];
}

/**
 * Returns indices of an array that match a predicate.
 * @param array An array of values
 * @param predicate A predicate function
 * @returns An array of indices
 */
export function filterIndices<T>(array: T[], predicate: (value: T) => boolean) {
  const result = [] as number[];
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) result.push(i);
  }
  return result;
}

/**
 * Checks whether two arrays of strings have matching values.
 *
 * @param array1 An array of strings
 * @param array2 Another array of strings
 * @returns `true` if the arrays have the exact same elements
 */
export function stringArraysMatch(array1: string[], array2: string[]) {
  if (array1.length !== array2.length) return false;
  const s1 = array1.toSorted(compareAlphaNumeric).join(``);
  const s2 = array2.toSorted(compareAlphaNumeric).join(``);
  return s1 === s2;
}

export function clearNodeChildren(node: HTMLElement) {
  node.innerHTML = ``;
}
