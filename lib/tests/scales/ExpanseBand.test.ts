import { describe, expect, test } from "bun:test";
import { Expanse } from "../../scales/Expanse";
import { ExpanseBand } from "../../scales/ExpanseBand";

describe("Expanse band", () => {
  const expanse = ExpanseBand.of(["a", "b", "c", "d"]);

  test("Normalizing limits returns [1/2n, (2n - 1)/2n]", () => {
    expect(["a", "d"].map((x) => Expanse.normalize(expanse, x))).toEqual([
      1 / 8,
      7 / 8,
    ]);
  });

  test(`Normalizing "b" in ["a", "b", "c", "d"] returns 3/8`, () => {
    expect(Expanse.normalize(expanse, "b")).toBe(3 / 8);
  });

  // test(`Normalizing "b" in ["a", "b", "c", "d"] with [0.1, 0.9] margins returns 0.1 + 3/8 * 0.8`, () => {
  //   Expanse.set(expanse, (e) => ((e.zero = 0.1), (e.one = 0.9)));
  //   expect(Expanse.normalize(expanse, "b")).toBe(0.1 + (3 / 8) * 0.8);
  //   Expanse.reset(expanse);
  // });

  test(`Reordering ["a", "b", "c", "d"] with [2, 1, 0, 3] equals ["c", "b", "a", "d"]`, () => {
    ExpanseBand.reorder(expanse, [2, 1, 0, 3]);
    expect(ExpanseBand.breaks(expanse)).toEqual(["c", "b", "a", "d"]);
    expect(Expanse.normalize(expanse, "a")).toBe(5 / 8);
    Expanse.reset(expanse);
  });
});
