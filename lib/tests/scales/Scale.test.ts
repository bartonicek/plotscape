import { describe, expect, test } from "bun:test";
import { Scale } from "../../main";
import { ExpanseContinuous } from "../../scales/ExpanseContinuous";

const scale = Scale.of(
  ExpanseContinuous.of(1, 10),
  ExpanseContinuous.of(0, 600),
);

describe(`Scale`, () => {
  test(`Pushing forward domain limits returns codomain limits`, () => {
    expect([1, 10].map((x) => Scale.pushforward(scale, x))).toEqual([0, 600]);
  });

  test(`Pulling back codomain limits returns domain limits`, () => {
    expect([0, 600].map((x) => Scale.pullback(scale, x))).toEqual([1, 10]);
  });

  test(`Pushing forward a value at 1/3 of the domain range returns value at 1/3 of the codomain range`, () => {
    // ((4 - 1) / 9) * 600 = 200
    expect(Scale.pushforward(scale, 4)).toBeCloseTo(200);
  });

  test(`Pushing forward domain limits with [0.1, 0.9] margins returns the margins, in codomain space`, () => {
    Scale.set(scale, () => ({ zero: 0.1, one: 0.9 }));
    expect([1, 10].map((x) => Scale.pushforward(scale, x))).toEqual([60, 540]);
    Scale.reset(scale);
  });

  test(`Pushing forward a value at 1/3 of the domain range with [0.1, 0.9] margins 
    returns value at 0.1 + (1/3) * (0.9 - 0.1) of the codomain range`, () => {
    // (0.1 + ((4 - 1) / 9) * (0.9 - 0.1)) * 600 = 220
    Scale.set(scale, () => ({ zero: 0.1, one: 0.9 }));
    expect(Scale.pushforward(scale, 4)).toBeCloseTo(220);
    Scale.reset(scale);
  });

  test(`Moving a scale by an amount is equal to incrementing the zero and one properties by the same amount`, () => {
    Scale.move(scale, 0.1);
    expect([scale.props.zero, scale.props.one]).toEqual([0.1, 1.1]);
    Scale.reset(scale);
  });

  test(`Pushing forward domain limits on a flipped scale returns flipped codomain limits`, () => {
    Scale.flip(scale);
    expect([1, 10].map((x) => Scale.pushforward(scale, x))).toEqual([600, 0]);
  });
});
