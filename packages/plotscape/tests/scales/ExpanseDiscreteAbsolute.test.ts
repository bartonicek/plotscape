import { describe, expect, test } from "bun:test";
import { newExpanseDiscreteAbsolute } from "../../lib/scales/ExpanseDiscreteAbsolute";

describe(`Expanse discrete absolute`, () => {
  const arr = ["a", "b", "c", "d"];
  const expanse1 = newExpanseDiscreteAbsolute(arr);

  test(`Normalizing first value returns 0`, () => {
    expect(expanse1.normalize(`a`)).toBe(0);
  });

  test(`Normalizing last value returns 1`, () => {
    expect(expanse1.normalize(`d`)).toBe(1);
  });

  test(`Values are equally spaced`, () => {
    expect(arr.map((x) => expanse1.normalize(x))).toEqual([0, 1 / 3, 2 / 3, 1]);
  });

  test(`Defaultizing restores original order, zero, and one.`, () => {
    expanse1.setOrder([1, 2, 3, 0]).setZeroOne(-1, 2);
    expanse1.defaultize();
    const { order, zero, one } = expanse1;
    expect(order).toEqual([0, 1, 2, 3]);
    expect([zero, one]).toEqual([0, 1]);
  });

  // It's 5.555% not 5% since (0.05) / 0.9 = 0.555
  test(`Setting [zero, one] to [0.05, 0.95] expands the limits by 5.555%`, () => {
    expanse1.setZeroOne(0.05, 0.95);
    expect(expanse1.normalize(`a`)).toBe(0.05);
    expect(expanse1.normalize(`d`)).toBe(0.95);
    expanse1.setZeroOne(0, 1);
  });

  test(`Setting order works as expected`, () => {
    expanse1.setOrder([1, 2, 3, 0]);
    expect(arr.map((x) => expanse1.normalize(x))).toEqual([1 / 3, 2 / 3, 1, 0]);
    expanse1.defaultize();
  });
});
