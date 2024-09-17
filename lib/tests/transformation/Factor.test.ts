import { describe, expect, test } from "bun:test";
import { Factor, POSITIONS } from "../../transformation/Factor";

// Some data
const group = ["A", "B", "B", "C", "A", "B"];
const income = [100, 450, 150, 300, 100, 120];

const factor1 = Factor.from(group);
const factor2 = Factor.bin(income, { anchor: 0, width: 100 });
const factor3 = Factor.product(factor1, factor2);

describe("Factor", () => {
  test(`Factor.from assigns indices correctly`, () => {
    expect(factor1.indices).toEqual(new Uint32Array([0, 1, 1, 2, 0, 1]));
    expect(factor1.cardinality).toBe(3);
  });

  test(`Indices and positions encode the same information (differently)`, () => {
    const indices = factor1.indices;
    const positions = factor1.data[POSITIONS];
    const check = [] as boolean[];

    for (let i = 0; i < indices.length; i++) {
      if (positions[indices[i]].includes(i)) check.push(true);
      else check.push(false);
    }

    expect(check).not.toContain(false);
  });

  test(`Factor.bin assigns indices correctly`, () => {
    expect(factor2.indices).toEqual(new Uint32Array([0, 3, 1, 2, 0, 1]));
    expect(factor2.cardinality).toBe(4);
  });

  test(`binMin and binMax are of correct distance from each other`, () => {
    const { binMin, binMax } = factor2.data;
    const diffs = [] as number[];
    for (let i = 0; i < binMin.length; i++) {
      diffs.push(binMax[i] - binMin[i]);
    }

    expect(diffs).toEqual([100, 100, 100, 100]);
  });

  test(`Factor.product assigns indices correctly (first factor precedence)`, () => {
    expect(factor3.indices).toEqual(new Uint32Array([0, 2, 1, 3, 0, 1]));
  });
});
