import { defaultParameters } from "./defaultParameters";
import { Margins } from "./types";

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
export function throttle(fn: Function, period: number) {
  let lastTime = 0;
  return (...args: any[]) => {
    const now = new Date().getTime();
    if (now - lastTime < period) return;
    lastTime = now;
    fn(...args);
  };
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
    eventfn: (event: Event) => void,
    options?: { throttle?: number }
  ) {
    if (options?.throttle) eventfn = throttle(eventfn, options.throttle);
    object.dispatch.addEventListener(type, eventfn);
  };
}
