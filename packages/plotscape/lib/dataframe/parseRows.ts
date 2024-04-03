import { keys, seq, uniqueIntegers } from "utils";
import { ColumnParser, Dataframe, ParsedColumns, newDataframe } from "../main";

/**
 * Parses data in the row-based format, i.e. one where
 * the dataframe is an array of objects, each representing a row
 * with the same keys and value types representing the variables.
 *
 * @param rawData An array of objects
 * @param parseSpec A specification of which columns should be parsed and how
 * @param options An object with additional options
 * @returns A parsed dataframe
 */
export function parseRows<T extends Record<string, ColumnParser>>(
  rawData: any,
  parseSpec: T,
  options?: { maxRows?: number; sample?: number }
): Dataframe<ParsedColumns<T>> {
  if (!rawData.length) throw new Error(`Data should be an array of objects`);

  const columns = {} as any;

  const n = rawData.length;

  let { maxRows, sample } = options ?? {};
  const indices = sample
    ? uniqueIntegers(0, n, Math.min(sample, n))
    : seq(0, n);
  maxRows = maxRows ?? n;

  for (const k of keys(parseSpec)) columns[k] = [];

  for (let i = 0; i < indices.length && i < maxRows!; i++) {
    const values = rawData[indices[i]];
    for (const k of keys(parseSpec)) {
      const value = values[k];
      if (value === undefined) {
        throw new Error(`Cannot parse row with missing data: ${values}`);
      }
      columns[k].push(value);
    }
  }

  for (const k of keys(parseSpec)) columns[k] = parseSpec[k].parse(columns[k]);
  const data = newDataframe<ParsedColumns<T>>(columns);

  return data;
}
