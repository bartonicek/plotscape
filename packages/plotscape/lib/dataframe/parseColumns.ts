import { error, subsetOnIndices, uniqueIntegers } from "utils";
import { ColumnParser, ParsedColumns } from "./ColumnParser";
import { Dataframe, newDataframe } from "./Dataframe";

/**
 * Parses data stored in the column-based format, i.e. one where the
 * dataframe is an object and the properties are arrays (variables/columns)
 *
 * @param rawData An object of arrays
 * @param parseSpec A specification of which columns should be parsed and how
 * @param options An object with additional options
 * @returns A parsed dataframe
 */
export function parseColumns<T extends Record<string, ColumnParser>>(
  rawData: any,
  parseSpec: T,
  options?: { maxRows?: number; sample?: number }
): Dataframe<ParsedColumns<T>> {
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
