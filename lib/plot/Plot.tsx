import { Geom } from "../geoms/Geom";
import { Expanse, ExpanseContinuous, Scale } from "../main";
import { Reactive } from "../Reactive";
import { ExpanseType } from "../scales/ExpanseType";
import { colors, defaultParameters } from "../utils/defaultParameters";
import {
  addTailwind,
  copyValues,
  diff,
  getMargins,
  invertRange,
  makeDispatchFn,
  makeListenFn,
  max,
  rangeInverse,
  removeTailwind,
  sqrt,
  square,
  throttle,
  trunc,
} from "../utils/funs";
import { React } from "../utils/JSX";
import { baseLayers, dataLayers, Layers, Margins, Rect } from "../utils/types";
import { renderAxisLabels, renderAxisTitle } from "./axes";
import { Frame } from "./Frame";

enum Mode {
  Select = "select",
  Pan = "pan",
  Query = "query",
}

enum MouseButton {
  Left = 0,
  Right = 2,
}

type Scales = {
  x: Scale<Expanse, ExpanseContinuous>;
  y: Scale<Expanse, ExpanseContinuous>;
  area: Scale<Expanse, ExpanseContinuous>;
  width: Scale<Expanse, ExpanseContinuous>;
  height: Scale<Expanse, ExpanseContinuous>;
};

export type Frames = Layers & {
  [key in `base` | `under` | `user` | `xAxis` | `yAxis`]: Frame;
};

type EventType =
  | `resize`
  | `render`
  | `render-axes`
  | `mousedown`
  | `mouseup`
  | `activate`
  | `deactivate`
  | `lock`
  | `unlock`
  | `lock-others`
  | `selected`
  | `clear-transient`;

export enum PlotType {
  unknown = `unknown`,
  scatter = `scatter`,
  bar = `bar`,
}

export interface Plot extends Reactive {
  type: PlotType;

  container: HTMLElement;
  frames: Frames;

  scales: Scales;
  geoms: Geom[];
  margins: Margins;

  zoomStack: Rect[];

  parameters: {
    active: boolean;
    locked: boolean;
    mode: Mode;
    mousedown: boolean;
    mousebutton: MouseButton;
    mousecoords: Rect;
  };
}

export namespace Plot {
  export function of(options?: {
    scales?: { x?: ExpanseType; y?: ExpanseType };
  }): Plot {
    const type = PlotType.unknown;
    const container = <div class="relative w-full h-full z-12"></div>;

    const frames = {} as Frames;
    const scales = {} as Scales;
    const geoms = [] as Geom[];

    const { expandX, expandY } = defaultParameters;
    const zoomStack = [[expandX, expandY, 1 - expandX, 1 - expandY]] as Rect[];

    const parameters = {
      active: false,
      locked: false,
      mousedown: false,
      mousebutton: MouseButton.Left,
      mode: Mode.Select,
      mousecoords: [0, 0, 0, 0] as Rect,
    };

    const margins = getMargins();

    const plot = Reactive.of({
      type,
      container,
      frames,
      scales,
      geoms,
      zoomStack,
      parameters,
      margins,
    });

    setupFrames(plot, options);
    setupScales(plot, options);
    setupEvents(plot, options); // Need to set up events last

    return plot;
  }

  export const dispatch = makeDispatchFn<Plot, EventType>();
  export const listen = makeListenFn<Plot, EventType>();

  export function append(parent: HTMLElement, plot: Plot) {
    parent.appendChild(plot.container);
    Plot.dispatch(plot, `resize`);
  }

  export function addGeom(plot: Plot, geom: Geom) {
    geom.scales = plot.scales;
    plot.geoms.push(geom);
  }

  export function checkSelection(plot: Plot) {
    const { geoms, parameters, frames } = plot;
    const selectedCases = new Set<number>();

    for (const geom of geoms) {
      const selected = Geom.check(geom, parameters.mousecoords);
      for (let i = 0; i < selected.length; i++) selectedCases.add(selected[i]);
    }

    Plot.dispatch(plot, `selected`, { selected: Array.from(selectedCases) });
    Plot.dispatch(plot, `lock-others`);
    Frame.clear(frames.user);
    Frame.rectangleXY(frames.user, ...parameters.mousecoords);
  }

  export const mousemoveHandlers = { select, pan, query };

  function select(plot: Plot, event: MouseEvent) {
    const { container, parameters } = plot;
    if (!parameters.active || !parameters.mousedown) return;

    Plot.dispatch(plot, `clear-transient`);

    const { mousecoords } = parameters;
    const { clientHeight } = container;
    const x = event.offsetX;
    const y = clientHeight - event.offsetY;

    mousecoords[2] = x;
    mousecoords[3] = y;

    Plot.checkSelection(plot);
  }

  function pan(plot: Plot, event: MouseEvent) {
    const { container, scales, parameters } = plot;
    if (!parameters.active || !parameters.mousedown) return;

    const { mousecoords } = parameters;
    const { clientWidth, clientHeight } = container;
    const [x0, y0] = mousecoords;

    const x = event.offsetX;
    const y = clientHeight - event.offsetY;
    const xMove = (x - x0) / clientWidth;
    const yMove = (y - y0) / clientHeight;

    Scale.move(scales.x, xMove);
    Scale.move(scales.y, yMove);

    mousecoords[0] = x;
    mousecoords[1] = y;

    Plot.dispatch(plot, `clear-transient`);
  }

  function query() {}

  export const keydownHandlers = {
    [`r`]: reset,
    [`=`]: grow,
    [`-`]: shrink,
    [`[`]: fade,
    [`]`]: unfade,
    [`z`]: zoom,
    [`x`]: popzoom,
  };

  function grow(plot: Plot) {
    const { area, width } = plot.scales;
    Expanse.set(area.codomain, (e) => ((e.min *= 10 / 9), (e.max *= 10 / 9)));
    Expanse.set(width.codomain, (e) =>
      e.mult < 1 ? (e.mult *= 10 / 9) : null
    );
  }

  function shrink(plot: Plot) {
    const { area, width } = plot.scales;
    Expanse.set(area.codomain, (e) => ((e.min *= 9 / 10), (e.max *= 9 / 10)));
    Expanse.set(width.codomain, (e) => (e.mult *= 9 / 10));
  }

  function fade(plot: Plot) {
    for (const layer of baseLayers) {
      const frame = plot.frames[layer];
      const alpha = frame.context.globalAlpha;
      frame.context.globalAlpha = trunc((alpha * 9) / 10, 0, 1);
    }
    Plot.dispatch(plot, `render`);
  }

  function unfade(plot: Plot) {
    for (const layer of baseLayers) {
      const frame = plot.frames[layer];
      const alpha = frame.context.globalAlpha;
      frame.context.globalAlpha = trunc((alpha * 10) / 9, 0, 1);
    }
    Plot.dispatch(plot, `render`);
  }

  export function reset(plot: Plot) {
    for (const scale of Object.values(plot.scales)) {
      Scale.restoreDefaults(scale);
    }
    plot.zoomStack.length = 1;
    Plot.dispatch(plot, `render`);
  }

  export function zoom(plot: Plot, coords?: Rect) {
    const { scales, parameters, zoomStack } = plot;
    let [x0, y0, x1, y1] = coords ?? parameters.mousecoords;

    // If zoom area is too small, do nothing
    if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) return;

    const { x, y } = scales;

    [x0, x1] = [x0, x1].map((e) => trunc(Expanse.normalize(x.codomain, e)));
    [x0, x1] = [x0, x1].sort(diff);
    [y0, y1] = [y0, y1].map((e) => trunc(Expanse.normalize(y.codomain, e)));
    [y0, y1] = [y0, y1].sort(diff);

    Scale.expand(scales.x, x0, x1);
    Scale.expand(scales.y, y0, y1);

    const xStretch = rangeInverse(x0, x1);
    const yStretch = rangeInverse(y0, y1);
    const areaStretch = sqrt(max(xStretch, yStretch));

    Expanse.set(scales.width.codomain, (e) => (e.mult *= xStretch));
    Expanse.set(scales.height.codomain, (e) => (e.mult *= yStretch));
    Expanse.set(scales.area.codomain, (e) => (e.mult *= areaStretch));

    console.log(scales.height.codomain.mult);

    zoomStack.push([x0, y0, x1, y1]);
    Plot.dispatch(plot, `clear-transient`);
    Plot.dispatch(plot, `render`);
  }

  export function popzoom(plot: Plot) {
    const { scales, zoomStack } = plot;

    if (zoomStack.length === 1) return;

    const [x0, y0, x1, y1] = zoomStack[zoomStack.length - 1];

    const [ix0, ix1] = invertRange(x0, x1);
    const [iy0, iy1] = invertRange(y0, y1);

    Scale.expand(scales.x, ix0, ix1);
    Scale.expand(scales.y, iy0, iy1);

    console.log(scales.y.domain);

    const xStretch = rangeInverse(ix0, ix1);
    const yStretch = rangeInverse(iy0, iy1);
    const areaStretch = 1 / sqrt(max(1 / xStretch, 1 / yStretch));

    Expanse.set(scales.width.codomain, (e) => (e.mult *= xStretch));
    Expanse.set(scales.height.codomain, (e) => (e.mult *= yStretch));
    Expanse.set(scales.area.codomain, (e) => (e.mult *= areaStretch));

    zoomStack.pop();
    Plot.dispatch(plot, `clear-transient`);
    Plot.dispatch(plot, `render`);
  }
}

function setupFrames(plot: Plot, options?: {}) {
  const { container, frames } = plot;
  const margins = getMargins();
  const [bottom, left, top, right] = margins;
  const dataLayers = [7, 6, 5, 4, 3, 2, 1, 0] as const;

  // Default Tailwind classes
  const def = `absolute top-0 right-0 w-full h-full`;

  for (const layer of dataLayers) {
    const canvas = <canvas class={def}></canvas>;
    // Have to use base CSS - cannot use JavaScript to dynamically generate Tailwind classes
    canvas.style.zIndex = `${7 - layer + 2}`;

    const frame = Frame.of(canvas);
    const color = colors[layer];

    Frame.setContext(frame, { fillStyle: color, strokeStyle: color });
    frame.margins = margins;

    frames[layer] = frame;
  }

  frames.base = Frame.of(<canvas class={def + ` bg-gray-100 z-0`}></canvas>);
  Frame.setContext(frames.base, {
    font: `${defaultParameters.axisTitleFontsize}rem sans-serif`,
    textBaseline: `middle`,
    textAlign: `center`,
  });

  frames.under = Frame.of(
    <canvas
      class={def + ` bg-white z-1 border border-l-black border-b-black`}
    ></canvas>
  );

  frames.under.canvas.style.width = `calc(100% - ${left}px - ${right}px)`;
  frames.under.canvas.style.height = `calc(100% - ${bottom}px - ${top}px)`;
  frames.under.canvas.style.top = top + `px`;
  frames.under.canvas.style.right = right + `px`;

  frames.user = Frame.of(<canvas class={def + ` z-10`}></canvas>);
  frames.user.margins = margins;
  Frame.setContext(frames.user, { globalAlpha: 1 / 15 });

  frames.xAxis = Frame.of(<canvas class={def}></canvas>);
  Frame.setContext(frames.xAxis, {
    fillStyle: `#3B4854`,
    textBaseline: `top`,
    textAlign: `center`,
    font: `${defaultParameters.axisLabelFontsize}rem serif`,
  });

  frames.yAxis = Frame.of(<canvas class={def}></canvas>);
  Frame.setContext(frames.yAxis, {
    fillStyle: `#3B4854`,
    textBaseline: `middle`,
    textAlign: `right`,
    font: `${defaultParameters.axisLabelFontsize}rem serif`,
  });

  for (let [k, v] of Object.entries(frames)) {
    if (!isNaN(parseFloat(k))) k = `data-` + k;
    v.canvas.id = `frame-${k}`;
    Frame.append(v, container);
  }
}

function setupEvents(plot: Plot, options?: {}) {
  const { container, parameters, frames } = plot;
  const { mousecoords } = parameters;

  window.addEventListener(`resize`, () => Plot.dispatch(plot, `resize`));
  window.addEventListener(`keydown`, (e) => {
    if (parameters.active) Plot.dispatch(plot, e.key as EventType);
  });

  container.addEventListener(`mousedown`, (e) => {
    e.stopPropagation();

    const { locked } = parameters;

    Plot.dispatch(plot, `activate`);
    parameters.mousedown = true;
    parameters.mousebutton = e.button;

    if (e.button === MouseButton.Left) parameters.mode = Mode.Select;
    else if (e.button === MouseButton.Right) parameters.mode = Mode.Pan;

    const x = e.offsetX;
    const y = container.clientHeight - e.offsetY;

    copyValues([x, y, x, y], mousecoords);
    if (!locked && parameters.mode === Mode.Select) {
      Plot.dispatch(plot, `clear-transient`);
      Plot.checkSelection(plot);
    }

    Plot.dispatch(plot, `unlock`);
  });

  container.addEventListener(`contextmenu`, (e) => {
    e.preventDefault();
    parameters.mousedown = true;
    parameters.mousebutton = MouseButton.Right;
    parameters.mode = Mode.Pan;

    parameters.mousecoords[0] = e.offsetX;
    parameters.mousecoords[1] = container.clientHeight - e.offsetY;

    Frame.clear(frames.user);
  });

  container.addEventListener(`mouseup`, () => {
    parameters.mousedown = false;
  });

  container.addEventListener(
    `mousemove`,
    throttle((e) => Plot.mousemoveHandlers[parameters.mode](plot, e), 10)
  );

  for (const [k, v] of Object.entries(Plot.keydownHandlers)) {
    Plot.listen(plot, k as EventType, () => v(plot));
  }

  Plot.listen(plot, `resize`, () => {
    for (const frame of Object.values(plot.frames)) Frame.resize(frame);
    const { scales, margins } = plot;
    const { clientWidth, clientHeight } = container;
    const { x, y, width, height } = scales;

    const [bottom, left] = [margins[0], margins[1]];
    const [top, right] = [clientHeight - margins[2], clientWidth - margins[3]];
    const opts = { default: true };

    Expanse.set(x.codomain, (e) => ((e.min = left), (e.max = right)), opts);
    Expanse.set(y.codomain, (e) => ((e.min = bottom), (e.max = top)), opts);
    Expanse.set(width.codomain, (e) => (e.max = right - left), opts);
    Expanse.set(height.codomain, (e) => (e.max = top - bottom), opts);
  });

  for (const scale of Object.values(plot.scales)) {
    Scale.listen(scale, `changed`, () => {
      Plot.dispatch(plot, `render`);
      Plot.dispatch(plot, `render-axes`);
    });
  }

  Plot.listen(plot, `activate`, () => {
    addTailwind(container, `outline outline-2 outline-slate-600`);
    plot.parameters.active = true;
  });

  Plot.listen(plot, `deactivate`, () => {
    removeTailwind(container, `outline outline-2 outline-slate-600`);
    plot.parameters.active = false;
  });

  Plot.listen(plot, `render`, () => {
    for (const layer of dataLayers) Frame.clear(frames[layer]);
    for (const geom of plot.geoms) Geom.render(geom, plot.frames);
  });

  Plot.listen(plot, `clear-transient`, () => Frame.clear(frames.user));
  Plot.listen(plot, `lock`, () => (plot.parameters.locked = true));
  Plot.listen(plot, `unlock`, () => (plot.parameters.locked = false));

  Plot.listen(plot, `render-axes`, () => {
    for (const layer of [`base`, `xAxis`, `yAxis`] as const) {
      Frame.clear(frames[layer]);
    }

    renderAxisLabels(plot, `x`);
    renderAxisLabels(plot, `y`);
    renderAxisTitle(plot, `x`);
    renderAxisTitle(plot, `y`);
  });
}

function setupScales(
  plot: Plot,
  options?: { scales?: { x?: ExpanseType; y?: ExpanseType } }
) {
  const { scales, container } = plot;
  const { clientWidth: w, clientHeight: h } = container;

  const xDomain = Expanse[options?.scales?.x ?? ExpanseType.Continuous]();
  const yDomain = Expanse[options?.scales?.y ?? ExpanseType.Continuous]();

  scales.x = Scale.of(xDomain, Expanse.continuous(0, w));
  scales.y = Scale.of(yDomain, Expanse.continuous(0, h));
  scales.area = Scale.of(Expanse.continuous(), Expanse.continuous(0, 10));
  scales.height = Scale.of(Expanse.continuous(), Expanse.continuous(0, h));
  scales.width = Scale.of(Expanse.continuous(), Expanse.continuous(0, w));

  const { x, y, area, width, height } = scales;

  x.other = y;
  y.other = x;

  const opts = { default: true, silent: true };
  const { expandX: ex, expandY: ey } = defaultParameters;

  Expanse.set(x.domain, (e) => ((e.zero = ex), (e.one = 1 - ex)), opts);
  Expanse.set(y.domain, (e) => ((e.zero = ey), (e.one = 1 - ey)), opts);

  Expanse.set(area.domain, (e) => (e.ratio = true), opts);
  Expanse.set(area.codomain, (e) => ((e.trans = square), (e.inv = sqrt)), opts);

  Expanse.set(width.domain, (e) => (e.one = 1 - 2 * ex), opts);
  Expanse.set(height.domain, (e) => (e.one = 1 - 2 * ey), opts);
}
