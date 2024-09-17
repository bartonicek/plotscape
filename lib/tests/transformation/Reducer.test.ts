import { describe, expect, test } from "bun:test";
import { Factor } from "../../main";
import { Reducer } from "../../transformation/Reducer";

// Some data
const group = ["A", "B", "B", "C", "A", "B"];
const income = [100, 450, 150, 300, 100, 120];

const factor = Factor.from(group);
const reducedSum = Reducer.reduce(income, factor, Reducer.sum);
const reducedMax = Reducer.reduce(income, factor, Reducer.max);

describe(`Reducer`, () => {
  test(`Reducer.reduce correctly sums up an array of values, across factor levels`, () => {
    expect(Array.from(reducedSum)).toEqual([200, 720, 300]);
  });

  test(`Reducer.max correctly finds the maximum, across factor levels`, () => {
    expect(Array.from(reducedMax)).toEqual([100, 450, 300]);
  });
});
