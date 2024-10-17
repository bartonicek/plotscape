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
  export const PRIMITIVE = Symbol(`primitive-type`);
  export const OPTIONS = Symbol(`options`);

  export type Primitive = `points` | `rectanglesXY` | `rectanglesWH` | `lines`;
  export interface DrawOptions {
    vAnchor: VAnchor;
    hAnchor: HAnchor;
  }

  export interface Payload extends Record<string, unknown[]> {
    [PRIMITIVE]: Primitive;
    [OPTIONS]?: DrawOptions;
  }

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

  export function appendDefault(_container: HTMLElement, renderer: Renderer) {
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
