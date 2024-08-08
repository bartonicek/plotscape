import { describe, expect, test } from "bun:test";
import { orderIndices } from "../../utils/funs";

describe(`Utility functions`, () => {
  test(`orderIndices() returns correct indices`, () => {
    expect(orderIndices([2, 0, 0, 1, 0])).toEqual([4, 0, 1, 3, 2]);
  });
});
