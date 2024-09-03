export namespace DOM {
  export function select<T extends HTMLElement>(
    node: HTMLElement,
    selector: string,
  ) {
    return node.querySelector(selector) as T | undefined;
  }
}
