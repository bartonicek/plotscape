import { expect, test, describe } from "bun:test";
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

  test("Normalizing 5 in [10, 1] returns 5/9", () => {
    Expanse.flip(expanse);
    expect(Expanse.normalize(expanse, 5)).toBe(5 / 9);
    Expanse.restoreDefaults(expanse);
  });

  test("Normalizing 5 in [1, 10] with [0.1, 0.9] margins returns 0.1 + 4/9 * 0.8", () => {
    Expanse.set(expanse, () => ({ zero: 0.1, one: 0.9 }));
    expect(Expanse.normalize(expanse, 5)).toBe(0.1 + (4 / 9) * 0.8);
    Expanse.restoreDefaults(expanse);
  });

  test("Normalizing 4 in [1, 16] with square root transformation returns 1/3", () => {
    Expanse.set(expanse, () => ({ max: 16, trans: Math.sqrt }));
    expect(Expanse.normalize(expanse, 4)).toBe(1 / 3);
    Expanse.restoreDefaults(expanse);
  });
});
