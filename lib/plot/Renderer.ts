import { Polymorphic } from "../main";
import { HAnchor, MapFn, VAnchor } from "../utils/types";

export interface Renderer {
  type: string;
}

export interface RendererMethods {
  append(container: HTMLElement, renderer: Renderer): void;
  resize(renderer: Renderer): void;
  clear(renderer: Renderer): void;
  setAlpha(renderer: Renderer, setfn: MapFn<number, number>): void;
  resetAlpha(renderer: Renderer): void;
  render(renderer: Renderer, payload: Renderer.Payload): void;
}

export namespace Renderer {
  export type Type = `canvas` | `webgl`;

  export interface Points {
    primitive: `points`;
    x: number[];
    y: number[];
    radius: number[];
  }

  export interface RectanglesWH {
    primitive: `rectanglesWH`;
    x: number[];
    y: number[];
    w: number[];
    h: number[];
  }

  export interface RectanglesXY {
    primitive: `rectanglesXY`;
    x0: number[];
    y0: number[];
    x1: number[];
    y1: number[];
    area: number[];
  }

  export interface Lines {
    primitive: `lines`;
    x: number[][];
    y: number[][];
  }

  export type Payload = (Points | RectanglesWH | RectanglesXY | Lines) & {
    layer: (string | number)[];
    options?: { vAnchor?: VAnchor; hAnchor?: HAnchor };
  };

  // Polymorphic methods
  export const render = Polymorphic.of(renderDefault);
  export const clear = Polymorphic.of(clearDefault);
  export const resize = Polymorphic.of(resizeDefault);
  export const append = Polymorphic.of(appendDefault);
  export const setAlpha = Polymorphic.of(setAlphaDefault);
  export const resetAlpha = Polymorphic.of(resetAlphaDefault);

  export function renderDefault(renderer: Renderer, _payload: Payload) {
    throw Polymorphic.error(`render`, `renderer`, renderer.type);
  }

  export function clearDefault(renderer: Renderer) {
    throw Polymorphic.error(`clear`, `renderer`, renderer.type);
  }

  export function resizeDefault(renderer: Renderer) {
    throw Polymorphic.error(`resize`, `renderer`, renderer.type);
  }

  export function appendDefault(renderer: Renderer, _container: HTMLElement) {
    throw Polymorphic.error(`append`, `renderer`, renderer.type);
  }

  export function setAlphaDefault(
    renderer: Renderer,
    _setfn: MapFn<number, number>,
  ) {
    throw Polymorphic.error(`setAlpha`, `renderer`, renderer.type);
  }

  export function resetAlphaDefault(renderer: Renderer) {
    throw Polymorphic.error(`resetAlpha`, `renderer`, renderer.type);
  }
}
