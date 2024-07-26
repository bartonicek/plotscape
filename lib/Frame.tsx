import { Scale } from "./main";
import React from "./utils/JSX";
import { defaultParameters } from "./utils/defaultParameters";
import { HAnchor, Margins, VAnchor } from "./utils/types";

export interface Frame {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  parent?: HTMLElement;

  width: number;
  height: number;
  scalingFactor: number;
  margins: Margins;

  contextProps: Partial<ContextProps>;
}

type ContextProps<
  K extends keyof CanvasRenderingContext2D = keyof CanvasRenderingContext2D
> = {
  [key in K]: CanvasRenderingContext2D[key];
};

export namespace Frame {
  export function of(canvas: Node): Frame {
    if (!isCanvas(canvas)) {
      throw new Error(`Node must be a HTML5 canvas element`);
    }

    const context = canvas.getContext("2d")!;
    const { clientWidth, clientHeight, clientLeft, clientTop } = canvas;

    const width = clientWidth - clientLeft;
    const height = clientHeight - clientTop;
    const scalingFactor = Math.sqrt(2);
    const margins = [0, 0, 0, 0] as Margins;

    const contextProps = {};

    return {
      canvas,
      context,
      width,
      height,
      margins,
      scalingFactor,
      contextProps,
    };
  }

  export function append(frame: Frame, container: HTMLElement) {
    container.appendChild(frame.canvas);
    frame.parent = container;
  }

  export function setContext<K extends keyof CanvasRenderingContext2D>(
    frame: Frame,
    props: ContextProps<K>
  ) {
    for (const [k, v] of Object.entries(props) as [K, ContextProps<K>[K]][]) {
      frame.contextProps[k] = v;
      frame.context[k] = v;
    }
  }

  export function resize(frame: Frame) {
    const { context, canvas, scalingFactor } = frame;
    const { clientWidth, clientHeight, clientLeft, clientTop } = canvas;

    const width = clientWidth - clientLeft;
    const height = clientHeight - clientTop;

    frame.width = width;
    frame.height = height;
    frame.canvas.width = width * scalingFactor;
    frame.canvas.height = height * scalingFactor;

    for (const [k, v] of Object.entries(frame.contextProps)) {
      (frame.context as any)[k] = v; // TypeScript complains about read-only props
    }

    context.scale(scalingFactor, scalingFactor);
    Frame.clip(frame);
  }

  export function clip(frame: Frame) {
    const { context } = frame;
    let { width, height } = frame.canvas;
    const [bottom, left, top, right] = frame.margins;

    width = width - left - right;
    height = height - top - bottom;

    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();
  }

  export function clear(frame: Frame) {
    frame.context.clearRect(0, 0, frame.width, frame.height);
  }

  type DrawOptions = {
    vAnchor?: VAnchor;
    hAnchor?: HAnchor;
  };

  export function point(
    frame: Frame,
    x: number,
    y: number,
    options?: DrawOptions & { radius?: number }
  ) {
    const { context } = frame;
    const height = frame.canvas.clientHeight;
    const radius = options?.radius ?? defaultParameters.radius;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;
    const vAnchor = options?.vAnchor ?? VAnchor.Middle;

    x = x + 2 * (hAnchor - 1 / 2) * radius;
    y = height - y + 2 * (1 / 2 - vAnchor) * radius;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  export function rectangleXY(
    frame: Frame,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) {
    const { context, height } = frame;
    context.fillRect(x0, height - y0, x1 - x0, y0 - y1);
  }

  export function rectangleWH(
    frame: Frame,
    x: number,
    y: number,
    w: number,
    h: number,
    options?: DrawOptions
  ) {
    const { context, height } = frame;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;
    const vAnchor = options?.vAnchor ?? VAnchor.Middle;

    x = x - hAnchor * w;
    y = height - y + vAnchor * h;

    context.fillRect(x, y, w, -h);
  }
}

export function isCanvas(node: Node): node is HTMLCanvasElement {
  return node.nodeName === `CANVAS`;
}
