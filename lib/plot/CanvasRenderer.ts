import { areNumberArrays, isNumberArray } from "../main";
import {
  baseLayers,
  DataLayer,
  dataLayers,
  Flat,
  MapFn,
  Rect,
} from "../utils/types";
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
  export function of<T extends Record<string, FrameOptions>>(
    setup: T,
  ): CanvasRenderer<Flat<Record<keyof T, CanvasFrame>>> {
    const frames = {} as Record<string, CanvasFrame>;
    for (const [k, v] of Object.entries(setup)) {
      frames[k] = CanvasFrame.of(v);
      frames[k].canvas.id = `frame-${k}`;
      if (v.props) CanvasFrame.setContext(frames[k], v.props as any);
    }

    return { type: `canvas`, frames };
  }

  export function append(contaner: HTMLElement, renderer: CanvasRenderer) {
    for (const frame of Object.values(renderer.frames)) {
      contaner.appendChild(frame.canvas);
    }
  }

  export function resize(renderer: CanvasRenderer) {
    for (const frame of Object.values(renderer.frames)) {
      CanvasFrame.resize(frame);
    }
  }

  export function setAlpha(
    renderer: CanvasRenderer,
    setfn: MapFn<number, number>,
  ) {
    for (const layer of baseLayers) {
      CanvasFrame.setAlpha(renderer.frames[layer], setfn);
    }
  }

  export function resetAlpha(renderer: CanvasRenderer) {
    for (const layer of baseLayers) {
      CanvasFrame.resetAlpha(renderer.frames[layer]);
    }
  }

  export function clear(renderer: CanvasRenderer) {
    for (const layer of dataLayers) {
      CanvasFrame.clear(renderer.frames[layer]);
    }
  }

  export function render(renderer: CanvasRenderer, payload: Renderer.Payload) {
    const primitive = payload[Renderer.PRIMITIVE];
    const options = payload[Renderer.OPTIONS];

    switch (primitive) {
      case `points`: {
        const { layer, x, y, size } = payload;
        if (!isNumberArray(layer)) return;
        if (!isNumberArray(x)) return;
        if (!isNumberArray(y)) return;
        if (!isNumberArray(size)) return;
        points(renderer, layer, x, y, size, options);
        break;
      }
      case `rectanglesXY`: {
        const { layer, x0, y0, x1, y1, area } = payload;
        if (!isNumberArray(layer)) return;
        if (!isNumberArray(x0)) return;
        if (!isNumberArray(y0)) return;
        if (!isNumberArray(x1)) return;
        if (!isNumberArray(y1)) return;
        if (!isNumberArray(area)) return;
        rectanglesXY(renderer, layer, x0, y0, x1, y1, area);
        break;
      }
      case `rectanglesWH`: {
        const { layer, x, y, width, height } = payload;
        if (!isNumberArray(layer)) return;
        if (!isNumberArray(x)) return;
        if (!isNumberArray(y)) return;
        if (!isNumberArray(width)) return;
        if (!isNumberArray(height)) return;
        rectanglesWH(renderer, layer, x, y, width, height, options);
        break;
      }
      case `lines`: {
        const { layer, x, y } = payload;
        if (!isNumberArray(layer)) return;
        if (!areNumberArrays(x)) return;
        if (!areNumberArrays(y)) return;
        lines(renderer, layer, x, y);
        break;
      }
    }
  }

  export function points(
    renderer: CanvasRenderer,
    layer: number[],
    x: number[],
    y: number[],
    radius: number[],
    options?: Renderer.DrawOptions,
  ) {
    const { frames } = renderer;
    for (let i = 0; i < layer.length; i++) {
      const frame = frames[layer[i] as DataLayer];
      CanvasFrame.point(frame, x[i], y[i], radius[i], options);
    }
  }

  export function rectanglesXY(
    renderer: CanvasRenderer,
    layer: number[],
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
    layer: number[],
    x: number[],
    y: number[],
    width: number[],
    height: number[],
    options?: Renderer.DrawOptions,
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
