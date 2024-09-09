import { addTailwind } from "../main";
import { HAnchor, MapFn, Margins, VAnchor } from "../utils/types";

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
  K extends keyof CanvasRenderingContext2D = keyof CanvasRenderingContext2D,
> = {
  [key in K]: CanvasRenderingContext2D[key];
};

export namespace Frame {
  export function of(options: {
    classes?: string;
    margins?: [number, number, number, number];
    zIndex?: number;
    canvasStyles?: Partial<CSSStyleDeclaration>;
    contextProps?: Partial<ContextProps>;
  }): Frame {
    const canvas = document.createElement(`canvas`);
    const context = canvas.getContext("2d")!;

    addTailwind(canvas, options.classes ?? ``);
    for (const [k, v] of Object.entries(options.canvasStyles ?? {}) as any[]) {
      canvas.style[k] = v;
    }

    const { clientWidth, clientHeight, clientLeft, clientTop } = canvas;

    const width = clientWidth - clientLeft;
    const height = clientHeight - clientTop;
    const scalingFactor = 2;
    const margins = options.margins ?? ([0, 0, 0, 0] as Margins);
    const contextProps = options.contextProps ?? {};

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
    Frame.resize(frame);
  }

  export function setContext<K extends keyof CanvasRenderingContext2D>(
    frame: Frame,
    props: ContextProps<K>,
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
    let { width, height } = frame;
    const [bottom, left, top, right] = frame.margins;

    width = Math.max(width - left - right, 0);
    height = Math.max(height - top - bottom, 0);

    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();
  }

  export function clear(frame: Frame) {
    frame.context.clearRect(0, 0, frame.width, frame.height);
  }

  export function setAlpha(frame: Frame, setfn: MapFn<number>) {
    frame.context.globalAlpha = setfn(frame.context.globalAlpha);
  }

  export function resetAlpha(frame: Frame) {
    frame.context.globalAlpha = 1;
  }

  export function textWidth(frame: Frame, text: string) {
    return frame.context.measureText(text).width;
  }

  export function textHeight(frame: Frame, text: string) {
    const dims = frame.context.measureText(text);
    return dims.actualBoundingBoxAscent + dims.actualBoundingBoxDescent;
  }

  type DrawOptions = {
    vAnchor?: VAnchor;
    hAnchor?: HAnchor;
  };

  export function point(
    frame: Frame,
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

  export function rectangleXY(
    frame: Frame,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
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
    options?: DrawOptions,
  ) {
    const { context, height } = frame;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;
    const vAnchor = options?.vAnchor ?? VAnchor.Middle;

    x = x - hAnchor * w;
    y = height - y + vAnchor * h;

    context.fillRect(x, y, w, -h);
  }

  export function line(frame: Frame, x: number[], y: number[]) {
    const { context, height } = frame;

    context.beginPath();
    context.moveTo(x[0], height - y[0]);

    for (let i = 0; i < x.length; i++) {
      context.lineTo(x[i], height - y[i]);
    }

    context.stroke();
  }

  export function text(
    frame: Frame,
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
