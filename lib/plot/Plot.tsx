import { Geom } from "../geoms/Geom";
import { Expanse, ExpanseContinuous, Scale } from "../main";
import { Barplot } from "../plots/Barplot";
import { Fluctuationplot } from "../plots/Fluctplot";
import { Histogram } from "../plots/Histogram";
import { Lineplot } from "../plots/Lineplot";
import { Scatterplot } from "../plots/Scatterplot";
import { colors, defaultParameters } from "../utils/defaultParameters";
import {
  addTailwind,
  copyValues,
  diff,
  formatLabel,
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
import { Reactive } from "../utils/Reactive";
import {
  baseLayers,
  dataLayers,
  DataLayers,
  Margins,
  Rect,
} from "../utils/types";
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
  size: Scale<Expanse, ExpanseContinuous>;
  width: Scale<Expanse, ExpanseContinuous>;
  height: Scale<Expanse, ExpanseContinuous>;
};

export type Frames = DataLayers & {
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
  | `clear-transient`
  | `set-mode-query`
  | (string & {});

export interface Plot extends Reactive {
  type: Plot.Type;

  container: HTMLElement;
  queryDisplay: HTMLElement;
  frames: Frames;

  scales: Scales;
  margins: Margins;

  renderables: Geom[];
  selectables: Geom[];
  queryables: Geom[];

  zoomStack: Rect[];

  parameters: {
    active: boolean;
    locked: boolean;
    mode: Mode;
    mousedown: boolean;
    mousebutton: MouseButton;
    mousecoords: Rect;
    lastkey: string;
  };
}

export namespace Plot {
  export enum Type {
    Unknown = `unknown`,
    Scatter = `scatter`,
    Bar = `bar`,
    Histo = `histo`,
    Fluct = `fluct`,
    Line = `line`,
  }

  export function of(options?: {
    type?: Type;
    scales?: { x?: Expanse.Type; y?: Expanse.Type };
  }): Plot {
    const type = options?.type ?? Type.Unknown;
    const container = (
      <div id="plot-container" class="relative h-full w-full"></div>
    );
    const queryDisplay = (
      <div class="relative z-30 hidden w-fit border border-black bg-gray-50 p-2"></div>
    );

    container.appendChild(queryDisplay);

    const frames = {} as Frames;
    const scales = {} as Scales;

    const renderables = [] as Geom[];
    const selectables = [] as Geom[];
    const queryables = [] as Geom[];

    const { expandX, expandY } = defaultParameters;
    const zoomStack = [[expandX, expandY, 1 - expandX, 1 - expandY]] as Rect[];

    const parameters = {
      active: false,
      locked: false,
      mousedown: false,
      mousebutton: MouseButton.Left,
      mode: Mode.Select,
      mousecoords: [0, 0, 0, 0] as Rect,
      lastkey: ``,
    };

    const margins = getMargins();

    const plot = Reactive.of({
      type,
      container,
      queryDisplay,
      frames,
      scales,
      renderables,
      selectables,
      queryables,
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

  export const scatter = Scatterplot;
  export const bar = Barplot;
  export const fluct = Fluctuationplot;
  export const histo = Histogram;
  export const line = Lineplot;

  export function append(parent: HTMLElement, plot: Plot) {
    parent.appendChild(plot.container);
    Plot.dispatch(plot, `resize`);
  }

  export function addGeom(plot: Plot, geom: Geom) {
    geom.scales = plot.scales;
    plot.queryables.push(geom);
    plot.selectables.push(geom);
    plot.renderables.push(geom);
  }

  export function checkSelection(plot: Plot) {
    const { selectables, parameters, frames } = plot;
    const selectedCases = new Set<number>();

    for (const geom of selectables) {
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

  function query(plot: Plot, event: MouseEvent) {
    const { offsetX, offsetY } = event;
    const { container, queryDisplay, queryables } = plot;
    const { clientWidth, clientHeight } = container;

    queryDisplay.style.display = `none`;

    const x = offsetX;
    const y = clientHeight - offsetY;

    let result: Record<string, any> | undefined;
    for (const geom of queryables) {
      result = Geom.query(geom, [x, y]);
      if (result) break;
    }

    if (!result) return;

    let queryString = ``;
    for (const [k, v] of Object.entries(result)) {
      queryString += `${k}: ${formatLabel(v)}\n`;
    }

    queryDisplay.innerText = queryString;
    queryDisplay.style.display = `inline-block`;

    const queryStyles = getComputedStyle(queryDisplay);
    const queryWidth = parseFloat(queryStyles.width.slice(0, -2));
    const { clientWidth: width } = queryDisplay;

    if (x + queryWidth > clientWidth) {
      queryDisplay.style.left = `auto`;
      queryDisplay.style.right = `${width - offsetX + 5}px`;
    } else {
      queryDisplay.style.left = `${x + 5}px`;
      queryDisplay.style.right = `auto`;
    }

    queryDisplay.style.top = offsetY + `px`;
  }

  export const keydownHandlers = {
    [`r`]: reset,
    [`=`]: grow,
    [`-`]: shrink,
    [`[`]: fade,
    [`]`]: unfade,
    [`z`]: zoom,
    [`x`]: popZoom,
    [`q`]: setQueryMode,
  };

  function grow(plot: Plot) {
    const { area, size, width } = plot.scales;
    Expanse.set(area.codomain, (e) => ((e.min *= 10 / 9), (e.max *= 10 / 9)));
    Expanse.set(size.codomain, (e) => ((e.min *= 10 / 9), (e.max *= 10 / 9)));
    Expanse.set(width.codomain, (e) =>
      e.mult < 1 ? (e.mult *= 10 / 9) : null,
    );
  }

  function shrink(plot: Plot) {
    const { area, width, size } = plot.scales;
    Expanse.set(area.codomain, (e) => ((e.min *= 9 / 10), (e.max *= 9 / 10)));
    Expanse.set(size.codomain, (e) => ((e.min *= 9 / 10), (e.max *= 9 / 10)));
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

  export function setQueryMode(plot: Plot) {
    Plot.dispatch(plot, `set-mode-query`);
  }

  export function zoom(plot: Plot, coords?: Rect) {
    const { scales, parameters, zoomStack } = plot;
    let [x0, y0, x1, y1] = coords ?? parameters.mousecoords;

    // If zoom area is too small, do nothing
    if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) return;

    const { x, y } = scales;

    [x0, x1] = [x0, x1].map((e) =>
      trunc(Expanse.normalize(x.codomain, e) as number),
    );
    [x0, x1] = [x0, x1].sort(diff);
    [y0, y1] = [y0, y1].map((e) =>
      trunc(Expanse.normalize(y.codomain, e) as number),
    );

    [y0, y1] = [y0, y1].sort(diff);

    Scale.expand(scales.x, x0, x1);
    Scale.expand(scales.y, y0, y1);

    const xStretch = rangeInverse(x0, x1);
    const yStretch = rangeInverse(y0, y1);
    const areaStretch = sqrt(max(xStretch, yStretch));

    Expanse.set(scales.width.codomain, (e) => (e.mult *= xStretch));
    Expanse.set(scales.height.codomain, (e) => (e.mult *= yStretch));
    Expanse.set(scales.area.codomain, (e) => (e.mult *= areaStretch));
    Expanse.set(scales.size.codomain, (e) => (e.mult *= areaStretch));

    zoomStack.push([x0, y0, x1, y1]);
    Plot.dispatch(plot, `clear-transient`);
    Plot.dispatch(plot, `render`);
  }

  export function popZoom(plot: Plot) {
    const { scales, zoomStack } = plot;

    if (zoomStack.length === 1) return;

    const [x0, y0, x1, y1] = zoomStack[zoomStack.length - 1];

    const [ix0, ix1] = invertRange(x0, x1);
    const [iy0, iy1] = invertRange(y0, y1);

    Scale.expand(scales.x, ix0, ix1);
    Scale.expand(scales.y, iy0, iy1);

    const xStretch = rangeInverse(ix0, ix1);
    const yStretch = rangeInverse(iy0, iy1);
    const areaStretch = 1 / sqrt(max(1 / xStretch, 1 / yStretch));

    Expanse.set(scales.width.codomain, (e) => (e.mult *= xStretch));
    Expanse.set(scales.height.codomain, (e) => (e.mult *= yStretch));
    Expanse.set(scales.area.codomain, (e) => (e.mult *= areaStretch));
    Expanse.set(scales.size.codomain, (e) => (e.mult *= areaStretch));

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

  frames.base = Frame.of(<canvas class={def + ` z-0 bg-gray-100`}></canvas>);
  Frame.setContext(frames.base, {
    font: `${defaultParameters.axisTitleFontsize}rem sans-serif`,
    textBaseline: `middle`,
    textAlign: `center`,
  });

  frames.under = Frame.of(
    <canvas
      class={def + ` z-1 border border-b-black border-l-black bg-white`}
    ></canvas>,
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
    if (e.key === `q`) Plot.dispatch(plot, e.key as EventType);
    else if (parameters.active) Plot.dispatch(plot, e.key as EventType);
  });
  window.addEventListener(`keyup`, () => {
    parameters.mode = Mode.Select;
    plot.queryDisplay.style.display = `none`;
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
    throttle((e) => {
      Plot.mousemoveHandlers[parameters.mode](plot, e);
    }, 10),
  );

  for (const [k, v] of Object.entries(Plot.keydownHandlers)) {
    Plot.listen(plot, k as EventType, () => v(plot));
  }

  Plot.listen(plot, `resize`, () => {
    for (const frame of Object.values(plot.frames)) Frame.resize(frame);
    const { scales, margins, frames } = plot;
    const { clientWidth, clientHeight } = container;
    const { x, y, width, height, area } = scales;

    const [bottom, left] = [margins[0], margins[1]];
    const [top, right] = [clientHeight - margins[2], clientWidth - margins[3]];
    const opts = { default: true };

    frames.under.canvas.style.width = `calc(100% - ${left}px - ${margins[3]}px)`;
    frames.under.canvas.style.height = `calc(100% - ${bottom}px - ${margins[2]}px)`;

    Expanse.set(x.codomain, (e) => ((e.min = left), (e.max = right)), opts);
    Expanse.set(y.codomain, (e) => ((e.min = bottom), (e.max = top)), opts);

    const [w, h] = [right - left, top - bottom];

    Expanse.set(width.codomain, (e) => (e.max = w), opts);
    Expanse.set(height.codomain, (e) => (e.max = h), opts);
    Expanse.set(area.codomain, (e) => (e.max = Math.min(w, h)));
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
    for (const geom of plot.renderables) Geom.render(geom, plot.frames);
  });

  Plot.listen(plot, `clear-transient`, () => Frame.clear(frames.user));
  Plot.listen(plot, `lock`, () => (parameters.locked = true));
  Plot.listen(plot, `unlock`, () => (parameters.locked = false));
  Plot.listen(plot, `set-mode-query`, () => (parameters.mode = Mode.Query));

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
  options?: { scales?: { x?: Expanse.Type; y?: Expanse.Type } },
) {
  const { scales, container } = plot;
  const { clientWidth: w, clientHeight: h } = container;

  const xDomain = Expanse[options?.scales?.x ?? Expanse.Type.Continuous]();
  const yDomain = Expanse[options?.scales?.y ?? Expanse.Type.Continuous]();

  scales.x = Scale.of(xDomain, Expanse.continuous(0, w));
  scales.y = Scale.of(yDomain, Expanse.continuous(0, h));
  scales.height = Scale.of(Expanse.continuous(), Expanse.continuous(0, h));
  scales.width = Scale.of(Expanse.continuous(), Expanse.continuous(0, w));
  scales.area = Scale.of(Expanse.continuous(), Expanse.continuous());
  scales.size = Scale.of(Expanse.continuous(), Expanse.continuous(0, 10));

  const { x, y, width, height, size, area } = scales;

  x.other = y;
  y.other = x;

  const opts = { default: true, silent: true };
  const { expandX: ex, expandY: ey } = defaultParameters;

  Expanse.set(x.domain, (e) => ((e.zero = ex), (e.one = 1 - ex)), opts);
  Expanse.set(y.domain, (e) => ((e.zero = ey), (e.one = 1 - ey)), opts);

  Expanse.set(area.domain, (e) => (e.ratio = true), opts);
  Expanse.set(size.domain, (e) => (e.ratio = true), opts);
  Expanse.set(area.codomain, (e) => ((e.trans = square), (e.inv = sqrt)), opts);
  Expanse.set(size.codomain, (e) => ((e.trans = square), (e.inv = sqrt)), opts);

  Expanse.set(width.domain, (e) => (e.one = 1 - 2 * ex), opts);
  Expanse.set(height.domain, (e) => (e.one = 1 - 2 * ey), opts);

  // Truncate so e.g. bars cannot have negative height
  const trunc0 = (x: number) => Math.max(x, 0);
  Expanse.set(width.codomain, (e) => (e.inv = trunc0), opts);
  Expanse.set(height.codomain, (e) => (e.inv = trunc0), opts);
}
