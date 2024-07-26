import { describe, expect, test } from "bun:test";
import { Factor } from "../../aggregation/Factor";
import { POSITIONS } from "../../utils/symbols";
import { fetchJSON } from "../../utils/funs";
import { Mtcars } from "../../utils/datasetSchemas";
import { Glob } from "bun";

// Data comes from:  const mtcars: Mtcars = await Bun.file(`./datasets/mtcars.json`).json();
// Here its supplied in code so that it's a bit easier to see what's going on:

const mtcars = {
  cyl: [
    6, 6, 4, 6, 8, 6, 8, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, 4, 4, 4, 4, 8, 8, 8, 8,
    4, 4, 4, 8, 6, 8, 4,
  ],
  mpg: [
    21, 21, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, 19.2, 17.8, 16.4, 17.3,
    15.2, 10.4, 10.4, 14.7, 32.4, 30.4, 33.9, 21.5, 15.5, 15.2, 13.3, 19.2,
    27.3, 26, 30.4, 15.8, 19.7, 15, 21.4,
  ],
};

const factor1 = Factor.from(mtcars.cyl);
const factor2 = Factor.bin(mtcars.mpg, { width: 5 });
const factor3 = Factor.product(factor1, factor2);

describe("Factor", () => {
  test(`Factor.from assigns indices correctly`, () => {
    expect(factor1.indices).toEqual([
      1, 1, 0, 1, 2, 1, 2, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2,
      0, 0, 0, 2, 1, 2, 0,
    ]);
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
    expect(factor2.indices).toEqual([
      3, 3, 3, 3, 2, 2, 1, 3, 3, 2, 2, 2, 2, 1, 0, 0, 1, 5, 4, 5, 3, 2, 1, 1, 2,
      4, 4, 4, 2, 2, 1, 3,
    ]);
    expect(factor2.cardinality).toBe(6);
  });

  test(`binMin and binMax are of correct distance from each other`, () => {
    const { binMin, binMax } = factor2.data;
    const diffs = [] as number[];
    for (let i = 0; i < binMin.length; i++) {
      diffs.push(binMax[i] - binMin[i]);
    }
    for (let i = 0; i < diffs.length; i++) expect(diffs[5]).toBeCloseTo(5);
  });

  test(`Factor.product assigns indices correctly (first factor precedence)`, () => {
    expect(factor3.indices).toEqual([
      4, 4, 0, 4, 7, 3, 6, 0, 0, 3, 3, 7, 7, 6, 5, 5, 6, 2, 1, 2, 0, 7, 6, 6, 7,
      1, 1, 1, 7, 3, 6, 0,
    ]);
  });
});
