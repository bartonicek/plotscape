import { Emitter, subscribable } from "./mixins/Emitter";

export interface Context extends Emitter<"resized"> {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width(): number;
  height(): number;
  resize(): this;
  setStyle(key: keyof CSSStyleDeclaration, value: string): this;
  setBackgroundColor(color: string): this;
  drawPoint(x: number, y: number, radius?: number): void;
  drawSquare(x: number, y: number, width: number, height: number): void;
}

export function newContext(container: HTMLDivElement): Context {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  container.appendChild(canvas);

  const self = subscribable({
    container,
    canvas,
    context,
    width,
    height,
    resize,
    setStyle,
    setBackgroundColor,
    drawPoint,
    drawSquare,
  });

  self.resize();

  window.addEventListener("resize", () => self.resize());

  return self;
}

function setStyle<K extends keyof CSSStyleDeclaration>(
  this: Context,
  key: K,
  value: CSSStyleDeclaration[K]
) {
  this.canvas.style[key] = value;
  return this;
}

function width(this: Context) {
  return Math.floor(this.container.clientWidth);
}

function height(this: Context) {
  return Math.floor(this.container.clientHeight);
}

function resize(this: Context) {
  const [width, height] = [this.width(), this.height()];

  this.canvas.width = width;
  this.canvas.height = height;

  this.emit("resized");

  return this;
}

function setBackgroundColor(this: Context, color: string) {
  this.canvas.style.backgroundColor = color;
  return this;
}

function drawPoint(this: Context, x: number, y: number, radius = 5) {
  const height = this.height();
  this.context.beginPath();
  this.context.arc(x, height - y, radius, 0, Math.PI * 2);
  this.context.fill();
}

function drawSquare(this: Context, x: number, y: number, w: number, h: number) {
  const height = this.height();
  x = x - w / 2;
  y = height - y - h / 2;

  this.context.fillRect(x, y, w, h);
}
