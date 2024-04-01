import { ElementWrapper, StyleDict, element, entries } from "utils";
import graphicParameters from "../graphicParameters.json";
import { Observable, observable } from "../mixins/Observable";
import { HorizontalAnchor, Margins, VerticalAnchor } from "../types";

type RenderOptions = {
  hAnchor?: HorizontalAnchor;
  vAnchor?: VerticalAnchor;
};

/* -------------------------------- Interface ------------------------------- */

/**
 * Wrapper around the HTML canvas element and its corresponding 2d context.
 * Includes methods for resizing, styling, and drawing.
 */
export interface Context extends Observable {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  canvasWrapper: ElementWrapper<HTMLCanvasElement>;
  context: CanvasRenderingContext2D;

  width: number;
  height: number;
  scalingFactor: number;
  fontsize: number;
  clipped: boolean;
  margins: Margins;
  contextProps: Record<string, any>;

  resize(): this;
  clip(): this;
  setMargins(margins: Margins): this;
  addClass(name: string): this;
  getProp<K extends keyof CanvasRenderingContext2D>(
    key: K
  ): CanvasRenderingContext2D[K];
  setAttribute<K extends keyof HTMLCanvasElement>(
    key: K,
    value: HTMLCanvasElement[K]
  ): this;
  setStyles(styles: StyleDict): this;
  setProps<K extends keyof CanvasRenderingContext2D>(props: {
    [key in K]: CanvasRenderingContext2D[K];
  }): this;
  setBackgroundColor(color: string): this;

  textWidth(string: string): number;
  textHeight(string: string): number;

  clear(): this;

  point(
    x: number,
    y: number,
    options?: RenderOptions & { radius?: number }
  ): this;

  rectangleXY(x0: number, y0: number, x1: number, y1: number): this;

  rectangleWH(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: RenderOptions
  ): this;

  line(x: number[], y: number[]): this;

  text(
    x: number,
    y: number,
    label: string,
    options?: { vertical?: boolean }
  ): this;
}

/* ------------------------------- Constructor ------------------------------ */

export function newContext(container: HTMLDivElement): Context {
  const canvasWrapper = element(`canvas`).appendTo(container);
  const canvas = canvasWrapper.get();
  const context = canvas.getContext("2d")!;

  const props = {
    node: canvas,
    container,
    canvas,
    canvasWrapper,
    context,
    contextProps: {},
  };

  const pars = {
    clipped: false,
    margins: [0, 0, 0, 0] as Margins,
    fontsize: graphicParameters.axisLabelFontsize,
    width: 0,
    height: 0,
    scalingFactor: 2,
  };

  const methods = {
    resize,
    clip,
    setMargins,
    addClass,
    getProp,
    setAttribute,
    setStyles,
    setProps,
    setBackgroundColor,
    textWidth,
    textHeight,
    clear,
    point,
    rectangleXY,
    rectangleWH,
    line,
    text,
  };

  const self = observable({ ...props, ...pars, ...methods });
  self.resize();

  window.addEventListener("resize", () => self.resize());

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function resize(this: Context) {
  const { context, canvas, contextProps, scalingFactor, clipped } = this;
  const { clientWidth, clientHeight, clientLeft, clientTop } = canvas;

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

  this.emit();
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

function getProp<K extends keyof CanvasRenderingContext2D>(
  this: Context,
  key: K
) {
  return this.context[key];
}

function setProps<K extends keyof CanvasRenderingContext2D>(
  this: Context,
  props: ContextProps<K>
) {
  for (const [k, v] of entries(props)) {
    this.contextProps[k] = v;
    this.context[k] = v;
  }
  return this;
}

function clear(this: Context) {
  this.context.clearRect(0, 0, this.width, this.height);
  return this;
}

function point(
  this: Context,
  x: number,
  y: number,
  options?: RenderOptions & { radius?: number }
) {
  const { height } = this;
  const radius = options?.radius ?? graphicParameters.defaultRadius;
  const hAnchor = options?.hAnchor ?? HorizontalAnchor.Center;
  const vAnchor = options?.vAnchor ?? VerticalAnchor.Middle;

  x = x + 2 * (hAnchor - 1 / 2) * radius;
  y = height - y + 2 * (1 / 2 - vAnchor) * radius;

  this.context.beginPath();
  this.context.arc(x, y, radius, 0, Math.PI * 2);
  this.context.fill();

  return this;
}

function rectangleXY(
  this: Context,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const { context, height } = this;
  context.fillRect(x0, height - y0, x1 - x0, y0 - y1);

  return this;
}

function rectangleWH(
  this: Context,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: RenderOptions
) {
  const { height } = this;
  const hAnchor = options?.hAnchor ?? HorizontalAnchor.Center;
  const vAnchor = options?.vAnchor ?? VerticalAnchor.Middle;

  x = x - hAnchor * w;
  y = height - y + vAnchor * h;

  this.context.fillRect(x, y, w, -h);

  return this;
}

function line(this: Context, x: number[], y: number[]) {
  const { context, height } = this;

  context.beginPath();
  context.moveTo(x[0], height - y[0]);
  for (let i = 1; i < x.length; i++) context.lineTo(x[i], height - y[i]);
  context.stroke();

  return this;
}

function text(
  this: Context,
  x: number,
  y: number,
  label: string,
  options?: { vertical?: boolean }
) {
  const { context, height } = this;

  context.save();
  context.translate(x, height - y);
  if (options?.vertical) context.rotate(-Math.PI / 2);
  context.fillText(label, 0, 0);
  context.translate(-x, -(height - y));
  context.restore();

  return this;
}

function textWidth(this: Context, string: string) {
  return this.context.measureText(string).width;
}

function textHeight(this: Context, string: string) {
  const measures = this.context.measureText(string);
  return measures.actualBoundingBoxAscent + measures.actualBoundingBoxDescent;
}
