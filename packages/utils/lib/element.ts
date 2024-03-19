import { Properties } from "csstype";

type ElementTag = keyof HTMLElementTagNameMap;
type EventTag = keyof GlobalEventHandlersEventMap;
export type StyleDict = Properties;

export interface ElementWrapper<T extends HTMLElement> {
  node: T;
  get(): T;
  append(child: Element): this;
  appendTo(parent: Element): this;
  text(text: string): this;
  html(html: string): this;
  addClass(name: string): this;
  setAttribute<K extends keyof T>(key: K, value: T[K]): this;
  setStyles(styles: Properties): this;
}

export function element<
  K extends ElementTag,
  T extends HTMLElement = HTMLElementTagNameMap[K]
>(tag: K): ElementWrapper<T> {
  const node = document.createElement(tag) as unknown as T;
  return {
    node,
    get,
    append,
    appendTo,
    text,
    html,
    addClass,
    setAttribute,
    setStyles,
  };
}

function get<T extends HTMLElement>(this: ElementWrapper<T>) {
  return this.node;
}

function append<T extends HTMLElement>(
  this: ElementWrapper<T>,
  child: HTMLElement
) {
  this.node.appendChild(child);
  return this;
}

function appendTo<T extends HTMLElement>(
  this: ElementWrapper<T>,
  parent: HTMLElement
) {
  parent.appendChild(this.node);
  return this;
}

function text<T extends HTMLElement>(this: ElementWrapper<T>, text: string) {
  this.node.innerText = text;
  return this;
}

function html<T extends HTMLElement>(this: ElementWrapper<T>, html: string) {
  this.node.innerHTML = html;
  return this;
}

function addClass<T extends HTMLElement>(
  this: ElementWrapper<T>,
  name: string
) {
  this.node.classList.add(name);
  return this;
}

function setAttribute<T extends HTMLElement, K extends keyof T>(
  this: ElementWrapper<T>,
  key: K,
  value: T[K]
) {
  this.node[key] = value;
  return this;
}

function setStyles<T extends HTMLElement>(
  this: ElementWrapper<T>,
  styles: Properties
) {
  for (const [k, v] of Object.entries(styles)) {
    this.node.style[k as any] = v;
  }
  return this;
}
