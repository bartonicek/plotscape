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
    return () => value;
  }

  export function identity() {
    return (index: number) => index;
  }

  export function computed<T>(callbackfn: (index: number) => T) {
    return (index: number) => callbackfn(index);
  }
}
