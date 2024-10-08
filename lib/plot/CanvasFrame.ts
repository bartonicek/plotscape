import { DOM } from "../utils/DOM";
import { tw } from "../utils/funs";
import { HAnchor, MapFn, Margins, VAnchor } from "../utils/types";

export interface CanvasFrame {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  parent?: HTMLElement;

  width: number;
  height: number;
  scalingFactor: number;
  margins: Margins;

  contextProps: Partial<ContextProps>;
}

export type ContextProps<
  K extends keyof CanvasRenderingContext2D = keyof CanvasRenderingContext2D,
> = {
  [key in K]: CanvasRenderingContext2D[key];
};

export namespace CanvasFrame {
  export function of(options: {
    classes?: string;
    margins?: [number, number, number, number];
    zIndex?: number;
    canvasStyles?: Partial<CSSStyleDeclaration>;
    contextProps?: Partial<ContextProps>;
  }): CanvasFrame {
    const canvas = DOM.element(`canvas`);
    const context = canvas.getContext("2d")!;

    DOM.addClasses(canvas, tw(options.classes ?? ""));
    for (const [k, v] of Object.entries(options.canvasStyles ?? {}) as any[]) {
      canvas.style[k] = v;
    }

    const { clientWidth, clientHeight, clientLeft, clientTop } = canvas;

    const width = clientWidth - clientLeft;
    const height = clientHeight - clientTop;
    const scalingFactor = 2;
    const { margins = [0, 0, 0, 0], contextProps = {} } = options;

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

  export function append(frame: CanvasFrame, container: HTMLElement) {
    container.appendChild(frame.canvas);
    frame.parent = container;
    CanvasFrame.resize(frame);
  }

  export function setContext<K extends keyof CanvasRenderingContext2D>(
    frame: CanvasFrame,
    props: ContextProps<K>,
  ) {
    for (const [k, v] of Object.entries(props) as [K, ContextProps<K>[K]][]) {
      frame.contextProps[k] = v;
      frame.context[k] = v;
    }
  }

  export function resize(frame: CanvasFrame) {
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
    CanvasFrame.clip(frame);
  }

  export function clip(frame: CanvasFrame) {
    const { context } = frame;
    let { width, height } = frame;
    const [bottom, left, top, right] = frame.margins;

    width = Math.max(width - left - right, 0);
    height = Math.max(height - top - bottom, 0);

    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();
  }

  export function clear(frame: CanvasFrame) {
    frame.context.clearRect(0, 0, frame.width, frame.height);
  }

  export function setAlpha(frame: CanvasFrame, setfn: MapFn<number>) {
    frame.context.globalAlpha = setfn(frame.context.globalAlpha);
  }

  export function resetAlpha(frame: CanvasFrame) {
    frame.context.globalAlpha = 1;
  }

  export function textWidth(frame: CanvasFrame, text: string) {
    return frame.context.measureText(text).width;
  }

  export function textHeight(frame: CanvasFrame, text: string) {
    const dims = frame.context.measureText(text);
    return dims.actualBoundingBoxAscent + dims.actualBoundingBoxDescent;
  }

  type DrawOptions = {
    vAnchor?: VAnchor;
    hAnchor?: HAnchor;
  };

  export function point(
    frame: CanvasFrame,
    x: number,
    y: number,
    radius: number,
    options?: DrawOptions,
  ) {
    const { context } = frame;
    const height = frame.canvas.clientHeight;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;
    const vAnchor = options?.vAnchor ?? VAnchor.Middle;

    x = x + 2 * (hAnchor - 1 / 2) * radius;
    y = height - y + 2 * (1 / 2 - vAnchor) * radius;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  export function points(
    frames: CanvasFrame[],
    x: number[],
    y: number[],
    radius: number[],
    options?: DrawOptions,
  ) {
    for (let i = 0; i < x.length; i++) {
      point(frames[i], x[i], y[i], radius[i], options);
    }
  }

  export function rectangleXY(
    frame: CanvasFrame,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    area: number,
  ) {
    const { context, height } = frame;

    const rx = x1 - x0;
    const ry = y1 - y0;

    x0 = x0 + ((1 - area) / 2) * rx;
    x1 = x1 - ((1 - area) / 2) * rx;
    y0 = y0 + ((1 - area) / 2) * ry;
    y1 = y1 - ((1 - area) / 2) * ry;

    context.fillRect(x0, height - y0, x1 - x0, y0 - y1);
  }

  export function rectanglesXY(
    frames: CanvasFrame[],
    x0: number[],
    y0: number[],
    x1: number[],
    y1: number[],
    area: number[],
  ) {
    for (let i = 0; i < x0.length; i++) {
      rectangleXY(frames[i], x0[i], y0[i], x1[i], y1[i], area[i]);
    }
  }

  export function rectangleWH(
    frame: CanvasFrame,
    x: number,
    y: number,
    w: number,
    h: number,
    options?: DrawOptions,
  ) {
    const { context, height } = frame;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;
    const vAnchor = options?.vAnchor ?? VAnchor.Middle;

    x = x - hAnchor * w;
    y = height - y + vAnchor * h;

    context.fillRect(x, y, w, -h);
  }

  export function rectanglesWH(
    frames: CanvasFrame[],
    x: number[],
    y: number[],
    w: number[],
    h: number[],
    options?: DrawOptions,
  ) {
    for (let i = 0; i < x.length; i++) {
      rectangleWH(frames[i], x[i], y[i], w[i], h[i], options);
    }
  }

  export function line(frame: CanvasFrame, x: number[], y: number[]) {
    const { context, height } = frame;

    context.beginPath();
    context.moveTo(x[0], height - y[0]);

    for (let i = 0; i < x.length; i++) {
      context.lineTo(x[i], height - y[i]);
    }

    context.stroke();
  }

  export function lines(frames: CanvasFrame[], x: number[][], y: number[][]) {
    for (let i = 0; i < x.length; i++) line(frames[i], x[i], y[i]);
  }

  export function text(
    frame: CanvasFrame,
    x: number,
    y: number,
    label: string,
    options?: { vertical?: boolean },
  ) {
    const { context, height } = frame;

    context.save();
    context.translate(x, height - y);
    if (options?.vertical) context.rotate(-Math.PI / 2);
    context.fillText(label, 0, 0);
    context.translate(-x, -(height - y));
    context.restore();
  }
}

export function isCanvas(node: Node): node is HTMLCanvasElement {
  return node.nodeName === `CANVAS`;
}
