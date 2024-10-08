import { describe, expect, test } from "bun:test";
import { Expanse } from "../../scales/Expanse";
import { ExpanseContinuous } from "../../scales/ExpanseContinuous";

describe("Expanse continuous", () => {
  const expanse = ExpanseContinuous.of(1, 10);

  test("Normalizing limits returns 0 and 1", () => {
    expect([1, 10].map((x) => Expanse.normalize(expanse, x))).toEqual([0, 1]);
  });

  test("Normalizing 5 in [1, 10] returns 4/9", () => {
    expect(Expanse.normalize(expanse, 5)).toBe(4 / 9);
  });

  test("Unnormalizing 4/9 in [1, 10] returns 5", () => {
    expect(Expanse.unnormalize(expanse, 4 / 9)).toBe(5);
  });

  test("Normalizing 4 in [1, 16] with square root transformation returns 1/3", () => {
    Expanse.set(expanse, () => ({ max: 16, trans: Math.sqrt }));
    expect(Expanse.normalize(expanse, 4)).toBe(1 / 3);
    Expanse.reset(expanse);
  });
});
