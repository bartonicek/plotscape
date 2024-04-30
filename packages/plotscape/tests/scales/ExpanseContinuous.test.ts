import { describe, expect, test } from "bun:test";
import { newExpanseContinuous } from "../../lib/scales/ExpanseContinuous";
import { Direction } from "../../lib/types";

describe(`Expanse continuous`, () => {
  const expanse1 = newExpanseContinuous(1, 10);
  const expanse2 = newExpanseContinuous(1, 10);

  test(`Normalizing minimum returns zero`, () => {
    expect(expanse1.normalize(1)).toBe(0);
  });

  test(`Normalizing maximum returns one`, () => {
    expect(expanse1.normalize(10)).toBe(1);
  });

  test(`Unnormalizing 0.5 returns midpoint`, () => {
    expect(expanse1.unnormalize(0.5)).toBe(5.5);
  });

  test(`Defaultizing restores original min, max, zero, and one.`, () => {
    expanse1.setMinMax(-100, 200).setZeroOne(-5, 2);
    expanse1.defaultize();
    const { min, max, zero, one } = expanse1;
    expect([min, max, zero, one]).toEqual([1, 10, 0, 1]);
  });

  // It's 5.555% not 5% since (0.05) / 0.9 = 0.555
  test(`Setting [zero, one] to [0.05, 0.95] expands the limits by 5.555%`, () => {
    expanse1.setZeroOne(0.05, 0.95);
    expect(expanse1.unnormalize(0)).toBeCloseTo(0.5);
    expect(expanse1.unnormalize(1)).toBeCloseTo(10.5);
    expanse1.setZeroOne(0, 1);
  });

  test(`Correctly retrains on new data`, () => {
    expanse1.retrain([100, 1, 23, 15, -99]);
    const { min, max } = expanse1;
    expect([min, max]).toEqual([-99, 100]);
    expanse1.setMinMax(1, 10);
  });

  test(`Flipping twice is identity`, () => {
    expanse1.flip().flip();
    expect(expanse1.direction).toBe(Direction.Forward);
  });

  test(`Normalizing on flipped expanse returns the complement`, () => {
    expanse2.flip();
    expect(expanse1.normalize(3)).toBe(expanse2.normalize(8));
    expanse2.flip();
  });
});
