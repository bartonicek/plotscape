export namespace Getter {
  export function of<
    T extends number | string,
    U extends T[] | { get(index: number): T } | T
  >(value: U) {
    if (Array.isArray(value)) return (index: number) => value[index];
    if (typeof value === "number" || typeof value === "string") {
      return () => value;
    }
    return (index: number) => value.get(index);
  }

  export function constant<T>(value: T) {
    return {
      value,
      get() {
        return this.value;
      },
    };
  }

  export function identity() {
    return {
      get(index: number) {
        return index;
      },
    };
  }

  export function computed<T>(callbackfn: (index: number) => T) {
    return {
      get(index: number) {
        return callbackfn(index);
      },
    };
  }
}
