import { describe, expect, test } from "bun:test";
import { isSerializable, orderIndices } from "../../utils/funs";

describe(`Utility functions`, () => {
  test(`orderIndices() returns correct indices`, () => {
    expect(orderIndices([2, 0, 0, 1, 0])).toEqual([4, 0, 1, 3, 2]);
  });

  test(`isSerializable() correctly infers whether a value is serializable`, () => {
    expect(isSerializable(1)).toBe(true);
    expect(isSerializable(`foo`)).toBe(true);
    expect(isSerializable(null)).toBe(true);
    expect(isSerializable((x: number) => x + 1)).toBe(false);

    const dict = {
      name: `adam`,
      car: null,
      friends: [{ name: `sam`, age: 26 }],
    };

    const dictWithFun = {
      name: `adam`,
      car: null,
      friends: [
        {
          name: `sam`,
          age: 26,
          greeting() {
            return `hello`;
          },
        },
      ],
    };

    expect(isSerializable(dict)).toBe(true);
    expect(isSerializable(dictWithFun)).toBe(false);
  });
});
