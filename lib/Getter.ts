export namespace Getter {
  export function constant<T>(value: T, length: number) {
    return {
      length,
      get() {
        return value;
      },
    };
  }

  export function identity(length: number) {
    return {
      length,
      get(index: number) {
        return index;
      },
    };
  }

  export function computed<T>(
    callbackfn: (index: number) => T,
    length: number
  ) {
    return {
      length,
      get(index: number) {
        return callbackfn(index);
      },
    };
  }
}
