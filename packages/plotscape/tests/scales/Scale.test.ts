import { describe, expect, test } from "bun:test";
import { newExpanseDiscreteAbsolute } from "../../lib/scales/ExpanseDiscreteAbsolute";
import { ScaleType, newScale } from "../../lib/scales/Scale";

describe(`Scale`, () => {
  const scale1 = newScale();
  const scale2 = newScale();
  const domain1 = newExpanseDiscreteAbsolute(["a", "b", "c"]);

  test(`Default scale is continuous identity`, () => {
    expect(scale1.pushforward(Math.PI)).toBe(Math.PI);
  });

  test(`Setting discrete domain with scaletype ratio throws an error`, () => {
    scale1.setType(ScaleType.Ratio);
    expect(() => scale1.setDomain(domain1)).toThrow();
    scale1.setType(ScaleType.Interval);
  });

  test(`Moving after freeze does nothing`, () => {
    const result1 = scale1.pushforward(Math.PI);
    scale1.freezeZero().freezeOne().move(0.5);
    const result2 = scale1.pushforward(Math.PI);
    expect(result1).toBe(result2);
  });

  test(`Moving a linked scale moves the other scale too`, () => {
    scale2.linkTo(scale1);
    scale1.move(0.5);
    expect(scale2.domain.zero).toBe(scale1.domain.zero);
  });
});
1;
