import { describe, expect, test } from "bun:test";
import { Expanse } from "../../scales/Expanse";
import { ExpansePoint } from "../../scales/ExpansePoint";

describe("Expanse point", () => {
  const expanse = ExpansePoint.of(["a", "b", "c", "d"]);

  test("Normalizing limits returns [0, 1]", () => {
    expect(["a", "d"].map((x) => Expanse.normalize(expanse, x))).toEqual([
      0, 1,
    ]);
  });

  test(`Normalizing "b" in ["a", "b", "c", "d"] returns 1/3`, () => {
    expect(Expanse.normalize(expanse, "b")).toBe(1 / 3);
  });

  // test(`Normalizing "b" in ["a", "b", "c", "d"] with [0.1, 0.9] margins returns 0.1 + 1/3 * 0.8`, () => {
  //   Expanse.set(expanse, (e) => ((e.zero = 0.1), (e.one = 0.9)));
  //   expect(Expanse.normalize(expanse, "b")).toBe(0.1 + (1 / 3) * 0.8);
  //   Expanse.reset(expanse);
  // });

  test(`Unnormalizing 1/3 in ["a", "b", "c", "d"] returns "b"`, () => {
    expect(Expanse.unnormalize(expanse, 1 / 3)).toBe("b");
  });

  test(`Unnormalizing 2/5 in ["a", "b", "c", "d"] returns "b"`, () => {
    expect(Expanse.unnormalize(expanse, 2 / 5)).toBe("b");
  });

  test(`Unnormalizing 1/7 in ["a", "b", "c", "d"] returns "a"`, () => {
    expect(Expanse.unnormalize(expanse, 1 / 7)).toBe("a");
  });

  test(`Unnormalizing [1/3, 0, 1, 2/3] in ["a", "b", "c", "d"] returns ["b", "a", "d", "c"]`, () => {
    expect(
      [1 / 3, 0, 1, 2 / 3].map((x) => Expanse.unnormalize(expanse, x)),
    ).toEqual(["b", "a", "d", "c"]);
  });

  test(`Reordering ["a", "b", "c", "d"] with [2, 1, 0, 3] equals ["c", "b", "a", "d"]`, () => {
    ExpansePoint.reorder(expanse, [2, 1, 0, 3]);
    expect(ExpansePoint.breaks(expanse)).toEqual(["c", "b", "a", "d"]);
    expect(Expanse.normalize(expanse, "a")).toBe(2 / 3);
    Expanse.reset(expanse);
  });
});
