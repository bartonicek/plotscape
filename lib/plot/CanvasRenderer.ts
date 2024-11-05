import { Polymorphic } from "../utils/Polymorphic";
import { DataLayer, Flat, MapFn, Rect } from "../utils/types";
import { CanvasFrame, ContextProps } from "./CanvasFrame";
import { Renderer } from "./Renderer";

export interface CanvasRenderer<
  T extends Record<string, CanvasFrame> = Record<string, CanvasFrame>,
> {
  type: `canvas`;
  frames: Record<string, CanvasFrame>;
}

type FrameOptions = {
  classes?: string;
  styles?: Partial<CSSStyleDeclaration>;
  props?: Partial<ContextProps>;
  margins?: Rect;
};

export namespace CanvasRenderer {
  const type = `canvas`;

  export function of<T extends Record<string, FrameOptions>>(
    setup: T,
  ): CanvasRenderer<Flat<Record<keyof T, CanvasFrame>>> {
    const frames = {} as Record<string, CanvasFrame>;
    for (const [k, v] of Object.entries(setup)) {
      frames[k] = CanvasFrame.of(v);
      frames[k].canvas.id = `frame-${k}`;
      if (v.props) CanvasFrame.setContext(frames[k], v.props as any);
    }

    return { type, frames };
  }

  Polymorphic.set(Renderer.append, type, append);
  Polymorphic.set(Renderer.render, type, render);
  Polymorphic.set(Renderer.clear, type, clear);
  Polymorphic.set(Renderer.resize, type, resize);
  Polymorphic.set(Renderer.setAlpha, type, setAlpha);
  Polymorphic.set(Renderer.resetAlpha, type, resetAlpha);

  export function append(renderer: CanvasRenderer, contaner: HTMLElement) {
    for (const frame of Object.values(renderer.frames)) {
      contaner.appendChild(frame.canvas);
    }
  }

  export function resize(renderer: CanvasRenderer, frames?: string[]) {
    frames = frames ?? Object.keys(renderer.frames);
    for (const key of frames) CanvasFrame.resize(renderer.frames[key]);
  }

  export function setAlpha(
    renderer: CanvasRenderer,
    setfn: MapFn<number, number>,
    frames?: string[],
  ) {
    frames = frames ?? Object.keys(renderer.frames);
    for (const key of frames) CanvasFrame.setAlpha(renderer.frames[key], setfn);
  }

  export function resetAlpha(renderer: CanvasRenderer, frames?: string[]) {
    frames = frames ?? Object.keys(renderer.frames);
    for (const key of frames) CanvasFrame.resetAlpha(renderer.frames[key]);
  }

  export function clear(renderer: CanvasRenderer, frames?: string[]) {
    frames = frames ?? Object.keys(renderer.frames);
    for (const key of frames) CanvasFrame.clear(renderer.frames[key]);
  }

  export function render(renderer: CanvasRenderer, payload: Renderer.Payload) {
    const primitive = payload.primitive;

    switch (primitive) {
      case `points`: {
        const { layer, x, y, radius, options } = payload;
        points(renderer, layer, x, y, radius, options);
        break;
      }
      case `rectanglesXY`: {
        const { layer, x0, y0, x1, y1, area } = payload;
        rectanglesXY(renderer, layer, x0, y0, x1, y1, area);
        break;
      }
      case `rectanglesWH`: {
        const { layer, x, y, w, h } = payload;
        rectanglesWH(renderer, layer, x, y, w, h);
        break;
      }
      case `lines`: {
        const { layer, x, y } = payload as any;
        lines(renderer, layer, x, y);
        break;
      }
    }
  }

  export function points(
    renderer: CanvasRenderer,
    layer: (string | number)[],
    x: number[],
    y: number[],
    radius: number[],
    options?: any,
  ) {
    const { frames } = renderer;
    for (let i = 0; i < layer.length; i++) {
      const frame = frames[layer[i] as DataLayer];
      CanvasFrame.point(frame, x[i], y[i], radius[i], options);
    }
  }

  export function rectanglesXY(
    renderer: CanvasRenderer,
    layer: (string | number)[],
    x0: number[],
    y0: number[],
    x1: number[],
    y1: number[],
    area: number[],
  ) {
    const { frames } = renderer;
    for (let i = 0; i < layer.length; i++) {
      const frame = frames[layer[i] as DataLayer];
      CanvasFrame.rectangleXY(frame, x0[i], y0[i], x1[i], y1[i], area[i]);
    }
  }

  export function rectanglesWH(
    renderer: CanvasRenderer,
    layer: (string | number)[],
    x: number[],
    y: number[],
    width: number[],
    height: number[],
    options?: any,
  ) {
    const { frames } = renderer;
    for (let i = 0; i < layer.length; i++) {
      const frame = frames[layer[i] as DataLayer];
      CanvasFrame.rectangleWH(frame, x[i], y[i], width[i], height[i], options);
    }
  }

  export function lines(
    renderer: CanvasRenderer,
    layer: number[],
    x: number[][],
    y: number[][],
  ) {
    const { frames } = renderer;
    for (let i = 0; i < layer.length; i++) {
      const frame = frames[layer[i] as DataLayer];
      CanvasFrame.line(frame, x[i], y[i]);
    }
  }
}
