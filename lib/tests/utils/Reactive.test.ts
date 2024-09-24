import { describe, expect, test } from "bun:test";
import { Reactive } from "../../utils/Reactive";

const target = Reactive.of()({});
const receiver = [] as number[];

function reset() {
  receiver.length = 0;
  Reactive.removeAllListeners(target);
}

describe(`Reactive`, () => {
  test(`Reactive dispatch works as expected`, () => {
    Reactive.listen(target, `changed`, () => receiver.push(1));
    Reactive.dispatch(target, `changed`);
    expect(receiver).toEqual([1]);
    reset();
  });

  test(`Priority 1 gets executed before priority 2 gets executed before priority 3....`, () => {
    Reactive.listen(target, `changed`, () => receiver.push(1), { priority: 3 });
    Reactive.listen(target, `changed`, () => receiver.push(2), { priority: 2 });
    Reactive.listen(target, `changed`, () => receiver.push(3), { priority: 1 });
    Reactive.dispatch(target, `changed`);
    expect(receiver).toEqual([3, 2, 1]);
    reset();
  });
});
