export namespace DOM {
  export function element<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: { id?: string; classes?: string[]; textContent?: string },
  ) {
    const result = document.createElement(tag);
    if (options?.id) result.id = options.id;
    if (options?.classes) addClasses(result, options.classes);
    if (options?.textContent) result.textContent = options.textContent;
    return result;
  }

  export function append(parent: HTMLElement, child: HTMLElement) {
    parent.appendChild(child);
  }

  export function select<T extends HTMLElement>(
    element: HTMLElement,
    selector: string,
  ) {
    return element.querySelector(selector) as T | undefined;
  }

  export function setStyles(
    element: HTMLElement,
    styles: Partial<CSSStyleDeclaration>,
  ) {
    for (const [k, v] of Object.entries(styles)) {
      (element.style as any)[k] = v;
    }
  }

  export function addClasses(element: HTMLElement, classes: string[]) {
    if (!classes.length) return;
    for (const c of classes) element.classList.add(c);
  }

  export function removeClasses(element: HTMLElement, classes: string[]) {
    for (const c of classes) element.classList.remove(c);
  }

  export function clearChildren(node: HTMLElement) {
    node.innerHTML = ``;
  }
}
