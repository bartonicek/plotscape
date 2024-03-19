import { ElementWrapper, StyleDict, element, entries } from "utils";
import { Emitter, subscribable } from "./mixins/Emitter";
import { Margins } from "./types";

export interface Context extends Emitter<"resized"> {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  canvasWrapper: ElementWrapper<HTMLCanvasElement>;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  scalingFactor: number;
  clipped: boolean;
  margins: Margins;
  contextProps: Record<string, any>;
  resize(): this;
  clip(): this;
  setMargins(margins: Margins): this;
  addClass(name: string): this;
  setAttribute<K extends keyof HTMLCanvasElement>(
    key: K,
    value: HTMLCanvasElement[K]
  ): this;
  setStyles(styles: StyleDict): this;
  setProps<K extends keyof CanvasRenderingContext2D>(props: {
    [key in K]: CanvasRenderingContext2D[K];
  }): this;
  setBackgroundColor(color: string): this;
  drawPoint(x: number, y: number, radius?: number): void;
  drawSquare(x: number, y: number, width: number, height: number): void;
}

export function newContext(container: HTMLDivElement): Context {
  const canvasWrapper = element(`canvas`).appendTo(container);
  const canvas = canvasWrapper.get();
  const context = canvas.getContext("2d")!;

  const self = subscribable({
    node: canvas,
    container,
    canvas,
    canvasWrapper,
    context,
    clipped: false,
    margins: [0, 0, 0, 0] as Margins,
    width: 0,
    height: 0,
    scalingFactor: 3,
    contextProps: {},
    resize,
    clip,
    setMargins,
    addClass,
    setAttribute,
    setStyles,
    setProps,
    setBackgroundColor,
    drawPoint,
    drawSquare,
  });

  self.resize();

  window.addEventListener("resize", () => self.resize());

  return self;
}

function resize(this: Context) {
  const { context, canvas, contextProps, scalingFactor, clipped } = this;
  const { clientWidth, clientHeight, clientLeft, clientTop } = this.canvas;

  const width = clientWidth - clientLeft;
  const height = clientHeight - clientTop;

  this.width = width;
  this.height = height;
  this.canvas.width = width * scalingFactor;
  this.canvas.height = height * scalingFactor;

  // @ts-ignore
  for (const [k, v] of entries(contextProps)) context[k] = v;
  context.scale(scalingFactor, scalingFactor);

  if (clipped) this.clip();

  this.emit("resized");

  return this;
}

function clip(this: Context) {
  let { context, width, height } = this;
  const [bottom, left, top, right] = this.margins;

  width = width - left - right;
  height = height - top - bottom;

  context.beginPath();
  context.rect(left, top, width, height);
  context.clip();
  return this;
}

function setMargins(this: Context, margins: Margins) {
  this.margins = margins;
  this.clipped = true;
  return this;
}

function setAttribute<K extends keyof HTMLCanvasElement>(
  this: Context,
  key: K,
  value: HTMLCanvasElement[K]
) {
  this.canvasWrapper.setAttribute(key, value);
  return this;
}

function setStyles(this: Context, styles: StyleDict) {
  this.canvasWrapper.setStyles(styles);
  return this;
}

function setBackgroundColor(this: Context, color: string) {
  this.setStyles({ backgroundColor: color });
  return this;
}

function addClass(this: Context, name: string) {
  this.canvasWrapper.addClass(name);
  return this;
}

type ContextProps<K extends keyof CanvasRenderingContext2D> = {
  [key in K]: CanvasRenderingContext2D[key];
};

function setProps<K extends keyof CanvasRenderingContext2D>(
  this: Context,
  props: ContextProps<K>
) {
  for (const [k, v] of entries(props)) this.contextProps[k] = v;
  return this;
}

function drawPoint(this: Context, x: number, y: number, radius = 5) {
  const { height } = this;
  y = height - y;

  this.context.beginPath();
  this.context.arc(x, y, radius, 0, Math.PI * 2);
  this.context.fill();
}

function drawSquare(this: Context, x: number, y: number, w: number, h: number) {
  const { height } = this;
  x = x - w / 2;
  y = height - y - h / 2;

  this.context.fillRect(x, y, w, h);
}
