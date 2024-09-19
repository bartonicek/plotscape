import { describe, expect, test } from "bun:test";
import { Factor } from "../../transformation/Factor";
import { Reduced } from "../../transformation/Reduced";
import { Reducer } from "../../transformation/Reducer";

// Some data
const group = ["A", "B", "B", "C", "A", "B"];
const income = [100, 450, 150, 300, 100, 120];

const factor1 = Factor.mono(6);
const factor2 = Factor.product(factor1, Factor.from(group));

const reducedSumParent = Reducer.reduce(income, factor1, Reducer.sum);
const reducedSum = Reducer.reduce(income, factor2, Reducer.sum); // [200, 720, 300]
Reduced.setParent(reducedSum, reducedSumParent);

const reducedMaxParent = Reducer.reduce(income, factor1, Reducer.max);
const reducedMax = Reducer.reduce(income, factor2, Reducer.max); // [100, 450, 300]
Reduced.setParent(reducedMax, reducedMaxParent);

describe(`Reduced`, () => {
  test("Stacking sums works as intended", () => {
    expect(Array.from(Reduced.stack(reducedSum))).toEqual([200, 920, 1220]);
  });

  test("Stacking maximums works as intended", () => {
    expect(Array.from(Reduced.stack(reducedSum))).toEqual([200, 920, 1220]);
  });
});
