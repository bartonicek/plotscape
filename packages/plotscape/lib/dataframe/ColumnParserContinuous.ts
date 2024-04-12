import { Named, named } from "../mixins/Named";
import { Queryable, queryable } from "../mixins/Queryable";
import { Continuous, newContinuous } from "../variables/Continuous";

export interface ColumnParserContinuous extends Named, Queryable {
  options: { center: boolean; scale: boolean };
  parse(array: unknown[]): Continuous;
  center(): this;
  scale(): this;
}

export function newColumnParserContinuous(): ColumnParserContinuous {
  const options = { center: false, scale: false };
  return queryable(
    named({
      options,
      parse,
      center,
      scale,
    })
  );
}

function parse(this: ColumnParserContinuous, array: unknown[]) {
  const { center, scale } = this.options;

  if (!(center || scale)) return newContinuous(array as number[]);

  const resultArray = [] as number[];
  const summaries = { mean: 0, sumSquares: 0, sd: 0 };

  for (let i = 0; i < array.length; i++) {
    const { mean, sumSquares } = summaries;
    const value = array[i] as number;
    const oldMean = mean;

    const newMean = (i * mean + value) / (i + 1);
    const newSumSquares = sumSquares + (value - oldMean) * (value - newMean);

    summaries.mean = newMean;
    summaries.sumSquares = newSumSquares;
  }

  summaries.sd = Math.sqrt(summaries.sumSquares / array.length);

  for (let i = 0; i < array.length; i++) {
    const mean = center ? summaries.mean : 0;
    const sd = scale ? summaries.sd : 1;
    resultArray[i] = ((array[i] as number) - mean) / sd;
  }

  const result = newContinuous(resultArray);
  result.setQueryable(this.isQueryable());

  return result;
}

function center(this: ColumnParserContinuous) {
  this.options.center = true;
  return this;
}

function scale(this: ColumnParserContinuous) {
  this.options.scale = true;
  return this;
}
