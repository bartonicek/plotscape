import * as utils from "utils";
import { MapFn, compose, identity } from "utils";
import { Named, named } from "../mixins/Named";
import { Queryable, queryable } from "../mixins/Queryable";
import { Discrete, newDiscrete } from "../variables/Discrete";

enum Case {
  None,
  Lower,
  Upper,
}

export interface ColumnParserDiscrete extends Named, Queryable {
  options: { case: Case; capitalize: boolean; stripWS: boolean };
  parse(array: unknown[]): Discrete;
  toLowerCase(): this;
  toUpperCase(): this;
  capitalize(): this;
  stripWhitespace(): this;
}

export function newColumnParserDiscrete(): ColumnParserDiscrete {
  const options = { case: Case.None, capitalize: false, stripWS: false };
  return queryable(
    named({
      options,
      parse,
      toLowerCase,
      toUpperCase,
      capitalize,
      stripWhitespace,
    })
  );
}

function parse(this: ColumnParserDiscrete, array: unknown[]): Discrete {
  const { case: wordCase, capitalize, stripWS } = this.options;

  if (wordCase === Case.None && !(capitalize || stripWS)) {
    return newDiscrete(array.map(String));
  }

  const resultArray = Array(array.length) as string[];
  let mapfn: MapFn<string, string> = identity;

  if (wordCase === Case.Lower) mapfn = compose(mapfn, utils.toLowerCase);
  if (wordCase === Case.Upper) mapfn = compose(mapfn, utils.toUpperCase);
  if (stripWS) mapfn = compose(mapfn, utils.stripWhitespace);
  if (capitalize) mapfn = compose(mapfn, utils.capitalize);

  for (let i = 0; i < array.length; i++) {
    resultArray[i] = mapfn(String(array[i]));
  }

  return newDiscrete(resultArray);
}

function toLowerCase(this: ColumnParserDiscrete) {
  this.options.case = Case.Lower;
  return this;
}

function toUpperCase(this: ColumnParserDiscrete) {
  this.options.case = Case.Upper;
  return this;
}

function capitalize(this: ColumnParserDiscrete) {
  this.options.capitalize = true;
  return this;
}

function stripWhitespace(this: ColumnParserDiscrete) {
  this.options.stripWS = true;
  return this;
}
