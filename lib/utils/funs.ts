import { defaultParameters } from "./defaultParameters";
import { Indexable, Margins, Rect } from "./types";

export const sqrt = Math.sqrt;
export function square(x: number) {
  return x ** 2;
}

export async function fetchJSON(path: string) {
  return await (await fetch(path)).json();
}

export function minmax(array: number[]) {
  let [min, max] = [Infinity, -Infinity];
  for (let i = 0; i < array.length; i++) {
    min = Math.min(min, array[i]);
    max = Math.max(max, array[i]);
  }
  return [min, max];
}

/**
 * Computes a difference between two numbers.
 * @param x A number
 * @param y Another number
 * @returns The difference
 */
export function diff(x: number, y: number) {
  return x - y;
}

/**
 * The identity function.
 * @param x A value
 * @returns The same value back
 */
export function identity<T>(x: T) {
  return x;
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
 * Compares two strings alphanumerically (i.e. `ABC2 < ABC20`). Used for sorting.
 * @param x An alphanumeric string
 * @param y Another alphanumeric string
 * @returns `1` if first greater, `-1` if second greater
 */
export function compareAlphaNumeric(x: string, y: string) {
  return x.localeCompare(y, "en", { numeric: true });
}

export function computeBreaks(
  array: number[],
  options?: { width?: number; anchor?: number; nBins?: number }
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

export function getMargins() {
  const { marginLines, axisTitleFontsize } = defaultParameters;
  return marginLines.map((x) => x * axisTitleFontsize) as Margins;
}

export function addTailwind(element: HTMLElement, classList: string) {
  for (const c of classList.split(" ")) element.classList.add(c);
}

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
  period: number
) {
  let lastTime = 0;
  return function (...args: Parameters<T>) {
    const now = new Date().getTime();
    if (now - lastTime < period) return;
    lastTime = now;
    fn(...args);
  };
}

export function timeExecution(callbackfn: () => void) {
  const t1 = performance.now();
  callbackfn();
  const t2 = performance.now();
  return t2 - t1;
}

export function makeDispatchFn<
  T extends { dispatch: EventTarget },
  E extends string
>() {
  return function (object: T, type: E, data?: Record<string, any>) {
    object.dispatch.dispatchEvent(new CustomEvent(type, { detail: data }));
  };
}

export function makeListenFn<
  T extends { dispatch: EventTarget },
  E extends string
>() {
  return function (
    object: T,
    type: E,
    eventfn: (event: CustomEvent) => void,
    options?: { throttle?: number }
  ) {
    if (options?.throttle) eventfn = throttle(eventfn, options.throttle);
    object.dispatch.addEventListener(type, eventfn as EventListener);
  };
}
export function makeGetter<T>(arraylike: Indexable<T>) {
  if (Array.isArray(arraylike)) {
    return function (index: number) {
      return arraylike[index];
    };
  } else {
    return function (index: number) {
      return arraylike.get(index);
    };
  }
}

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

export function addIndexed(
  object: Record<string, any>,
  key: string,
  value: any
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

export function formatLabels(
  labels: number[] | string[],
  options?: { decimalPlaces?: number }
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

export function isNumberArray(array: any[]): array is number[] {
  return typeof array[0] === "number";
}
