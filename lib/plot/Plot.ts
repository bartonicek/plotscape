import { Geom } from "../geoms/Geom";
import { Barplot } from "../plots/Barplot";
import { Fluctuationplot } from "../plots/Fluctplot";
import { Histogram } from "../plots/Histogram";
import { Histogram2d } from "../plots/Histogram2d";
import { Pcoordsplot } from "../plots/Pcoordsplot";
import { Scatterplot } from "../plots/Scatterplot";
import { Expanse } from "../scales/Expanse";
import { ExpanseBand } from "../scales/ExpanseBand";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { ExpansePoint } from "../scales/ExpansePoint";
import { Scale } from "../scales/Scale";
import { defaultOptions, GraphicalOptions } from "../scene/defaultOptions";
import { DOM } from "../utils/DOM";
import {
  clearNodeChildren,
  copyValues,
  diff,
  formatLabel,
  invertRange,
  isDefined,
  last,
  max,
  orderIndicesByTable,
  rangeInverse,
  remove,
  removeTailwind,
  sqrt,
  square,
  stringArraysMatch,
  throttle,
  trunc,
  tw,
} from "../utils/funs";
import { Reactive } from "../utils/Reactive";
import {
  baseLayers,
  Dataframe,
  dataLayers,
  DataLayers,
  MouseButton,
  Rect,
} from "../utils/types";
import { renderAxisLabels, renderAxisTitles } from "./axes";
import { Frame } from "./Frame";

export type Frames = DataLayers & {
  [key in `base` | `under` | `over` | `user` | `xAxis` | `yAxis`]: Frame;
};

/**
 * A generic plot object which handles rendering data and reacting to DOM events.
 */
export interface Plot extends Reactive<Plot.Event> {
  type: Plot.Type;
  data: Dataframe[];

  container: HTMLElement;
  queryTable: HTMLElement;
  frames: Frames;

  scales: Plot.Scales;

  renderables: Geom[];
  selectables: Geom[];
  queryables: Geom[];

  zoomStack: Rect[];

  parameters: {
    active: boolean;
    locked: boolean;
    mode: Plot.Mode;
    mousedown: boolean;
    mousebutton: MouseButton;
    mousecoords: Rect;
    lastkey: string;
    ratio?: number;
  };

  options: GraphicalOptions;
}

export namespace Plot {
  export enum Mode {
    Select = "select",
    Pan = "pan",
    Query = "query",
  }

  export type Scales = {
    x: Scale<any, ExpanseContinuous>;
    y: Scale<any, ExpanseContinuous>;
    size: Scale<any, ExpanseContinuous>;
    width: Scale<any, ExpanseContinuous>;
    height: Scale<any, ExpanseContinuous>;
    area: Scale<any, ExpanseContinuous>;
    areaPct: Scale<ExpanseContinuous, ExpanseContinuous>;
  };

  export type Type =
    | `unknown`
    | `scatter`
    | `bar`
    | `histo`
    | `histo2d`
    | `fluct`
    | `pcoords`;

  export function of(
    options?: {
      id?: string;
      type?: Type;
      ratio?: number;
      scales?: { x?: `band` | `point`; y?: `band` | `point` };
    } & Partial<GraphicalOptions>,
  ): Plot {
    const type = options?.type ?? `unknown`;

    const container = DOM.element(`div`, { id: "plot" });
    const queryTable = DOM.element(`table`);
    DOM.addClasses(container, tw("relative h-full, w-full drop-shadow-md"));
    DOM.addClasses(queryTable, tw("relative z-30 bg-gray-50 shadow-md"));
    DOM.append(container, queryTable);

    const data = [] as Dataframe[];
    const frames = {} as Frames;
    const scales = {} as Scales;

    const renderables = [] as Geom[];
    const selectables = [] as Geom[];
    const queryables = [] as Geom[];

    const opts = structuredClone({ ...defaultOptions, ...options });

    const { expandX, expandY } = opts;
    const zoomStack = [[expandX, expandY, 1 - expandX, 1 - expandY]] as Rect[];

    const parameters = {
      active: false,
      locked: false,
      mousedown: false,
      mousebutton: MouseButton.Left,
      mode: Mode.Select,
      mousecoords: [0, 0, 0, 0] as Rect,
      lastkey: ``,
      ratio: options?.ratio ?? undefined,
    };

    const plot = Reactive.of()({
      type,
      data,
      container,
      queryTable,
      frames,
      scales,
      renderables,
      selectables,
      queryables,
      zoomStack,
      parameters,
      options: opts,
    });

    setupFrames(plot, opts);
    setupScales(plot, opts);
    setupEvents(plot); // Need to set up events last

    return plot;
  }

  export type Event =
    | `reset`
    | `resize`
    | `render`
    | `render-axes`
    | `activate`
    | `activated`
    | `deactivate`
    | `deactivated`
    | `lock`
    | `unlock`
    | `clear-transient`
    | `lock-others`
    | `set-selected`
    | `clear-transient`
    | `set-scale`
    | `grow`
    | `shrink`
    | `fade`
    | `unfade`
    | `zoom`
    | `pop-zoom`
    | `query-mode`
    | `normalize`
    | `set-parameters`
    | (string & {});

  export const scatter = Scatterplot;
  export const bar = Barplot;
  export const fluct = Fluctuationplot;
  export const histo = Histogram;
  export const histo2d = Histogram2d;
  export const pcoords = Pcoordsplot;

  export function append(parent: HTMLElement, plot: Plot) {
    parent.appendChild(plot.container);
    Plot.resize(plot);
  }

  export function setData(plot: Plot, data: Dataframe[]) {
    for (const data of plot.data) {
      if (Reactive.is(data)) Reactive.removeAll(data, `changed`);
    }

    plot.data.length = 0;
    for (let i = 0; i < data.length; i++) plot.data.push(data[i]);
    Reactive.listen(last(data) as any, `changed`, () => Plot.render(plot));
  }

  export function addGeom(plot: Plot, geom: Geom) {
    geom.scales = plot.scales;
    geom.data = plot.data as any;
    const { renderables, selectables, queryables } = plot;
    for (const e of [renderables, selectables, queryables]) {
      e.push(geom);
    }
  }

  export function deleteGeom(plot: Plot, geom: Geom) {
    const { renderables, selectables, queryables } = plot;
    for (const e of [renderables, selectables, queryables]) {
      remove(e, geom);
    }
  }

  export function activate(plot: Plot) {
    DOM.addClasses(plot.container, tw("outline outline-2 outline-slate-600"));
    plot.parameters.active = true;
    Reactive.dispatch(plot, `activated`);
  }

  export function deactivate(plot: Plot) {
    removeTailwind(plot.container, `outline outline-2 outline-slate-600`);
    plot.parameters.active = false;
    Reactive.dispatch(plot, `deactivated`);
  }

  export function lock(plot: Plot) {
    plot.parameters.locked = true;
  }

  export function unlock(plot: Plot) {
    plot.parameters.locked = false;
  }

  export function render(plot: Plot) {
    for (const layer of dataLayers) Frame.clear(plot.frames[layer]);
    for (const geom of plot.renderables) Geom.render(geom, plot.frames);
  }

  export function renderAxes(plot: Plot) {
    for (const layer of [`base`, `xAxis`, `yAxis`] as const) {
      Frame.clear(plot.frames[layer]);
    }
    renderAxisLabels(plot);
    renderAxisTitles(plot);
  }

  export function clearUserFrame(plot: Plot) {
    Frame.clear(plot.frames.user);
  }

  export function resize(plot: Plot) {
    for (const frame of Object.values(plot.frames)) Frame.resize(frame);
    const { container, scales, frames, parameters, options } = plot;
    const { clientWidth, clientHeight } = container;
    const { x, y, width, height, area } = scales;
    const { margins } = options;

    const [bottom, left] = [margins[0], margins[1]];
    const [top, right] = [clientHeight - margins[2], clientWidth - margins[3]];

    frames.under.canvas.style.width = `calc(100% - ${left}px - ${margins[3]}px)`;
    frames.under.canvas.style.height = `calc(100% - ${bottom}px - ${margins[2]}px)`;
    frames.over.canvas.style.width = `calc(100% - ${left}px - ${margins[3]}px)`;
    frames.over.canvas.style.height = `calc(100% - ${bottom}px - ${margins[2]}px)`;

    for (const frame of Object.values(frames)) Frame.clip(frame);

    const opts = { default: true, silent: true }; // Silent to avoid re-renders
    Expanse.set(x.codomain, (e) => ((e.min = left), (e.max = right)), opts);
    Expanse.set(y.codomain, (e) => ((e.min = bottom), (e.max = top)), opts);

    const [w, h] = [right - left, top - bottom];

    Expanse.set(width.codomain, (e) => (e.max = w), opts);
    Expanse.set(height.codomain, (e) => (e.max = h), opts);
    Expanse.set(area.codomain, (e) => (e.max = Math.min(w, h)), opts);

    if (parameters.ratio) {
      const { expandX: ex, expandY: ey } = defaultOptions;
      Expanse.set(x.domain, (e) => ((e.zero = ex), (e.one = 1 - ex)), opts);
      Expanse.set(y.domain, (e) => ((e.zero = ey), (e.one = 1 - ey)), opts);
      Plot.applyRatio(plot, parameters.ratio);
    }

    Plot.render(plot);
    Plot.renderAxes(plot);
  }

  export function checkSelection(plot: Plot) {
    const { selectables, parameters } = plot;
    const selectedCases = new Set<number>();

    for (const geom of selectables) {
      const selected = Geom.check(geom, parameters.mousecoords);
      for (let i = 0; i < selected.length; i++) selectedCases.add(selected[i]);
    }

    Reactive.dispatch(plot, `set-selected`, {
      cases: Array.from(selectedCases),
    });
  }

  export function setMode(plot: Plot, mode: Mode) {
    plot.parameters.mode = mode;
  }

  export function setMousedown(plot: Plot, value: boolean) {
    plot.parameters.mousedown = value;
  }

  export function setMouseButton(plot: Plot, button: MouseButton) {
    plot.parameters.mousebutton = button;
  }

  export const mousemoveHandlers = { select, pan, query };

  function select(plot: Plot, event: MouseEvent) {
    const { container, parameters, frames } = plot;
    if (!parameters.active || !parameters.mousedown) return;

    Reactive.dispatch(plot, `clear-transient`);

    const { mousecoords } = parameters;
    const { clientHeight } = container;
    const x = event.offsetX;
    const y = clientHeight - event.offsetY;

    mousecoords[2] = x;
    mousecoords[3] = y;

    Plot.checkSelection(plot);
    Reactive.dispatch(plot, `lock-others`);
    Frame.clear(frames.user);
    Frame.rectangleXY(frames.user, ...parameters.mousecoords, 1);
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

    Plot.clearUserFrame(plot);
  }

  function query(plot: Plot, event: MouseEvent) {
    const { offsetX, offsetY } = event;
    const { container, queryTable, queryables } = plot;
    const { clientWidth, clientHeight } = container;

    queryTable.style.display = `none`;

    const x = offsetX;
    const y = clientHeight - offsetY;

    let result: Record<string, any> | undefined;
    for (const geom of queryables) {
      result = Geom.query(geom, [x, y]);
      if (result) break;
    }

    if (!result) return;

    clearNodeChildren(queryTable);

    for (const [k, v] of Object.entries(result)) {
      const row = DOM.element(`tr`);
      const nameCell = DOM.element(`td`, {
        classes: tw("border border-gray-400 px-3 py-1"),
        textContent: k,
      });
      const valueCell = DOM.element(`td`, {
        classes: tw("border border-gray-400 px-3 py-1 font-mono"),
        textContent: formatLabel(v),
      });

      DOM.append(row, nameCell);
      DOM.append(row, valueCell);
      DOM.append(queryTable, row);
    }

    queryTable.style.display = `inline-block`;

    const queryStyles = getComputedStyle(queryTable);
    const queryWidth = parseFloat(queryStyles.width.slice(0, -2));
    const { clientWidth: width } = queryTable;

    if (x + queryWidth > clientWidth) {
      queryTable.style.left = `auto`;
      queryTable.style.right = `${width - offsetX + 5}px`;
    } else {
      queryTable.style.left = `${x + 5}px`;
      queryTable.style.right = `auto`;
    }

    queryTable.style.top = offsetY + `px`;
  }

  export const keybindings: Record<string, Event> = {
    [`=`]: `grow`,
    [`-`]: `shrink`,
    [`]`]: `unfade`,
    [`[`]: `fade`,
    [`z`]: `zoom`,
    [`x`]: `pop-zoom`,
    [`o`]: `reorder`,
    [`;`]: `decrement-anchor`,
    [`'`]: `increment-anchor`,
    [`n`]: `normalize`,
  };

  export function grow(plot: Plot) {
    const { area, size, width } = plot.scales;
    Expanse.set(area.codomain, (e) => ((e.min *= 10 / 9), (e.max *= 10 / 9)));
    Expanse.set(size.codomain, (e) => ((e.min *= 10 / 9), (e.max *= 10 / 9)));
    Expanse.set(width.codomain, (e) =>
      e.mult < 1 ? (e.mult *= 10 / 9) : null,
    );
  }

  export function shrink(plot: Plot) {
    const { area, width, size } = plot.scales;
    Expanse.set(area.codomain, (e) => ((e.min *= 9 / 10), (e.max *= 9 / 10)));
    Expanse.set(size.codomain, (e) => ((e.min *= 9 / 10), (e.max *= 9 / 10)));
    Expanse.set(width.codomain, (e) => (e.mult *= 9 / 10));
  }

  export function fade(plot: Plot) {
    const { frames } = plot;
    for (const layer of baseLayers) {
      Frame.setAlpha(frames[layer], (a) => (a * 9) / 10);
    }
    Plot.render(plot);
  }

  export function unfade(plot: Plot) {
    const { frames } = plot;
    for (const layer of baseLayers) {
      Frame.setAlpha(frames[layer], (a) => (a * 10) / 9);
    }
    Plot.render(plot);
  }

  export function reset(plot: Plot) {
    const { frames, scales } = plot;

    for (const layer of baseLayers) Frame.resetAlpha(frames[layer]);
    for (const scale of Object.values(scales)) Scale.restoreDefaults(scale);

    plot.zoomStack.length = 1;
    Plot.clearUserFrame(plot);
  }

  export function setQueryMode(plot: Plot) {
    Plot.setMode(plot, Mode.Query);
  }

  export function zoom(
    plot: Plot,
    options?: { coords?: Rect; units?: `data` | `screen` | `pct` },
  ) {
    const { scales, parameters, zoomStack } = plot;

    let { coords, units } = options ?? {};

    units = units ?? `screen`;
    let [x0, y0, x1, y1] = coords ?? parameters.mousecoords;

    const { x, y } = scales;

    // Normalize within data coordinates
    if (units === `data`) {
      // Need to first set zero and one to (0, 1) to ensure correct normalization
      const opts = { silent: true };
      Expanse.set(x.domain, (e) => ((e.zero = 0), (e.one = 1)), opts);
      Expanse.set(y.domain, (e) => ((e.zero = 0), (e.one = 1)), opts);

      x0 = Expanse.normalize(x.domain, x0);
      x1 = Expanse.normalize(x.domain, x1);
      y0 = Expanse.normalize(y.domain, y0);
      y1 = Expanse.normalize(y.domain, y1);
    }

    // Normalize within screen coordinates
    if (units === `screen`) {
      // If zoom area is too tiny, do nothing
      if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) return;

      x0 = trunc(Expanse.normalize(x.codomain, x0));
      x1 = trunc(Expanse.normalize(x.codomain, x1));
      y0 = trunc(Expanse.normalize(y.codomain, y0));
      y1 = trunc(Expanse.normalize(y.codomain, y1));
    }

    [x0, x1] = [x0, x1].sort(diff);
    [y0, y1] = [y0, y1].sort(diff);

    Scale.expand(scales.x, x0, x1);
    Scale.expand(scales.y, y0, y1);

    const xStretch = rangeInverse(x0, x1);
    const yStretch = rangeInverse(y0, y1);
    const areaStretch = sqrt(max(xStretch, yStretch));

    Expanse.set(scales.width.codomain, (e) => (e.max *= xStretch));
    Expanse.set(scales.height.codomain, (e) => (e.max *= yStretch));
    Expanse.set(scales.area.codomain, (e) => (e.max *= areaStretch));
    Expanse.set(scales.size.codomain, (e) => (e.max *= areaStretch));

    zoomStack.push([x0, y0, x1, y1]);

    Reactive.dispatch(plot, `clear-transient`);
    Plot.render(plot);
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

    Expanse.set(scales.width.codomain, (e) => (e.max *= xStretch));
    Expanse.set(scales.height.codomain, (e) => (e.max *= yStretch));
    Expanse.set(scales.area.codomain, (e) => (e.max *= areaStretch));
    Expanse.set(scales.size.codomain, (e) => (e.max *= areaStretch));

    zoomStack.pop();

    Plot.clearUserFrame(plot);
    Plot.render(plot);
  }

  export function setRatio(plot: Plot, ratio: number) {
    const { x, y } = plot.scales;
    if (!Expanse.isContinuous(x.domain) || !Expanse.isContinuous(y.domain)) {
      throw new Error(`Both axes need to be continuous to set a ratio`);
    }
    plot.parameters.ratio = ratio;
    Plot.resize(plot);
  }

  export function applyRatio(plot: Plot, ratio: number) {
    const { scales } = plot;
    const { x, y } = scales;

    const xRatio = Scale.unitRatio(x);
    const yRatio = Scale.unitRatio(y) * ratio;
    const opts = { default: true, silent: true };

    if (xRatio > yRatio) {
      const r = (yRatio / xRatio) * Expanse.unitRange(y.domain);

      Expanse.set(
        x.domain,
        (e) => ((e.zero = (1 - r) / 2), (e.one = (1 + r) / 2)),
        opts,
      );
    } else {
      const r = (xRatio / yRatio) * Expanse.unitRange(x.domain);

      Expanse.set(
        y.domain,
        (e) => ((e.zero = (1 - r) / 2), (e.one = (1 + r) / 2)),
        opts,
      );
    }
  }

  export function getScale(
    plot: Plot,
    scale: Exclude<keyof Plot.Scales, symbol>,
  ) {
    return plot.scales[scale].domain;
  }

  export function setScale(
    plot: Plot,
    scale: Exclude<keyof Plot.Scales, symbol>,
    options: {
      min?: number;
      max?: number;
      labels?: string[];
      zero?: number;
      one?: number;
      mult?: number;
      direction?: number;
      default?: boolean;
      unfreeze?: boolean;
    },
  ) {
    let { min, max, zero, one, mult, labels, direction } = options;
    const domain = plot.scales[scale].domain;
    const codomain = plot.scales[scale].codomain;

    if (!Object.keys(plot.scales).includes(scale)) {
      throw new Error(`Unrecognized scale '${scale}'`);
    }

    const opts = {
      default: options.default ?? false,
      unfreeze: options.unfreeze ?? false,
    };

    if ([zero, one].some(isDefined)) {
      zero = zero ?? domain.zero;
      max = max ?? domain.max;

      Expanse.set(domain, (e) => ((e.zero = zero), (e.one = one)), opts);
      plot.parameters.ratio = undefined;
    }

    if ([min, max].some(isDefined)) {
      if (!Expanse.isContinuous(domain)) {
        throw new Error(`Limits can only be set with a continuous scale`);
      }

      min = min ?? domain.min;
      max = max ?? domain.max;

      Expanse.set(domain, (e) => ((e.min = min!), (e.max = max!)), opts);
      plot.parameters.ratio = undefined;
    }

    if (labels) {
      if (!Expanse.isDiscrete(domain)) {
        throw new Error(`Labels can be ordered with a discrete scale only`);
      }

      if (!stringArraysMatch(domain.labels, labels)) {
        throw new Error(`Labels must match the scale's labels`);
      }

      const indices = orderIndicesByTable(domain.labels, labels);
      Expanse.reorder(domain, indices);
    }

    if (direction) Expanse.set(domain, (e) => (e.direction = direction), opts);
    if (mult) Expanse.set(codomain, (e) => (e.mult = mult), opts);
  }
}

function setupFrames(plot: Plot, options: GraphicalOptions) {
  const { container, frames } = plot;
  const { margins, colors, axisLabelSize: ls, axisTitleSize: ts } = options;

  const [bottom, left, top, right] = margins;
  const dataLayers = [7, 6, 5, 4, 3, 2, 1, 0] as const;

  const classes = `absolute top-0 right-0 w-full h-full `; // Default Tailwind classes

  for (const layer of dataLayers) {
    // Have to use base CSS: Tailwind classes cannnot be generated dynamically
    const canvasStyles = { zIndex: `${7 - layer + 2}` };
    const color = colors[layer];
    const contextProps = { fillStyle: color, strokeStyle: color };

    const frame = Frame.of({ classes, contextProps, canvasStyles, margins });
    frames[layer] = frame;
  }

  const base = Frame.of({ classes: classes + `bg-gray-100` });
  Frame.setContext(base, {
    font: `${ts}rem sans-serif`,
    textBaseline: `middle`,
    textAlign: `center`,
  });

  // Have to use base CSS here too (because of dynamic variables)
  const width = `calc(100% - ${left}px - ${right}px)`;
  const height = `calc(100% - ${bottom}px - ${top}px)`;
  const canvasStyles = { width, height, top: top + `px`, right: right + `px` };
  const under = Frame.of({ classes: classes + `z-1 bg-white`, canvasStyles });

  const overClasses = `z-10 border border-b-black border-l-black`;
  const over = Frame.of({ classes: classes + overClasses, canvasStyles });

  const user = Frame.of({ classes: classes + `z-10`, margins });
  Frame.setContext(user, { globalAlpha: 1 / 15 });

  const fillStyle = `#3B4854`;

  const xAxis = Frame.of({ classes: classes });
  Frame.setContext(xAxis, {
    fillStyle,
    textBaseline: `top`,
    textAlign: `center`,
    font: `${ls}rem serif`,
  });

  const yAxis = Frame.of({ classes: classes });
  Frame.setContext(yAxis, {
    fillStyle: `#3B4854`,
    textBaseline: `middle`,
    textAlign: `right`,
    font: `${ls}rem serif`,
  });

  Object.assign(frames, { base, under, over, user, xAxis, yAxis });

  for (let [k, v] of Object.entries(frames)) {
    if (!isNaN(parseFloat(k))) k = `data-` + k;
    v.canvas.id = `frame-${k}`;
    Frame.append(v, container);
  }
}

function setupEvents(plot: Plot) {
  const { container, parameters, frames } = plot;
  const { mousecoords } = parameters;

  for (const [k, v] of Object.entries(Plot.keybindings)) {
    Reactive.listen(plot, k, () => Reactive.dispatch(plot, v));
  }

  container.addEventListener(`mousedown`, (e) => {
    e.stopPropagation();

    const { locked } = parameters;

    Plot.activate(plot);
    Plot.setMousedown(plot, true);
    Plot.setMouseButton(plot, e.button);

    if (e.button === MouseButton.Left) {
      Plot.setMode(plot, Plot.Mode.Select);
    } else if (e.button === MouseButton.Right) {
      Plot.setMode(plot, Plot.Mode.Pan);
    }

    const x = e.offsetX;
    const y = container.clientHeight - e.offsetY;

    copyValues([x, y, x, y], mousecoords);

    if (!locked && parameters.mode === Plot.Mode.Select) {
      // Need to notify marker & all other plots
      Reactive.dispatch(plot, `clear-transient`);
      Plot.checkSelection(plot);
    }

    Plot.unlock(plot);
  });

  container.addEventListener(`contextmenu`, (e) => {
    e.preventDefault();

    Plot.setMousedown(plot, true);
    Plot.setMouseButton(plot, MouseButton.Right);
    Plot.setMode(plot, Plot.Mode.Pan);

    mousecoords[0] = e.offsetX;
    mousecoords[1] = container.clientHeight - e.offsetY;

    Frame.clear(frames.user);
  });

  container.addEventListener(`mouseup`, () => Plot.setMousedown(plot, false));

  container.addEventListener(
    `mousemove`,
    throttle((e) => {
      Plot.mousemoveHandlers[parameters.mode](plot, e);
    }, 20),
  );

  Reactive.listen(plot, `reset`, () => Plot.reset(plot));
  Reactive.listen(plot, `resize`, () => Plot.resize(plot));
  Reactive.listen(plot, `activate`, () => Plot.activate(plot));
  Reactive.listen(plot, `deactivate`, () => Plot.deactivate(plot));
  Reactive.listen(plot, `render`, () => Plot.render(plot));
  Reactive.listen(plot, `lock`, () => Plot.lock(plot));
  Reactive.listen(plot, `unlock`, () => Plot.unlock(plot));
  Reactive.listen(plot, `query-mode`, () =>
    Plot.setMode(plot, Plot.Mode.Query),
  );
  Reactive.listen(plot, `render-axes`, () => Plot.renderAxes(plot));
  Reactive.listen(plot, `clear-transient`, () => Plot.clearUserFrame(plot));

  Reactive.listen(plot, `get-scale`, (data) => {
    if (!data || !data.scale) return;
    return Plot.getScale(plot, data.scale);
  });

  Reactive.listen(plot, `set-scale`, (data) => {
    if (!data || !data.scale) return;
    Plot.setScale(plot, data.scale, data);
  });

  Reactive.listen(plot, `grow`, () => Plot.grow(plot));
  Reactive.listen(plot, `shrink`, () => Plot.shrink(plot));
  Reactive.listen(plot, `fade`, () => Plot.fade(plot));
  Reactive.listen(plot, `unfade`, () => Plot.unfade(plot));
  Reactive.listen(plot, `zoom`, (data) => Plot.zoom(plot, data));
  Reactive.listen(plot, `pop-zoom`, () => Plot.popZoom(plot));

  for (const scale of Object.values(plot.scales)) {
    Reactive.listen(scale, `changed`, () => {
      Plot.render(plot), Plot.renderAxes(plot);
    });
  }
}

function setupScales(
  plot: Plot,
  options: {
    scales?: { x?: `band` | `point`; y?: `band` | `point` };
  } & GraphicalOptions,
) {
  const { scales, container } = plot;
  const { clientWidth: w, clientHeight: h } = container;

  const table = {
    continuous: ExpanseContinuous,
    point: ExpansePoint,
    band: ExpanseBand,
  };

  const xDomain = table[options?.scales?.x ?? `continuous`].of();
  const yDomain = table[options?.scales?.y ?? `continuous`].of();

  scales.x = Scale.of(xDomain, ExpanseContinuous.of(0, w));
  scales.y = Scale.of(yDomain, ExpanseContinuous.of(0, h));
  scales.height = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of(0, h));
  scales.width = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of(0, w));
  scales.area = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());
  scales.size = Scale.of(
    ExpanseContinuous.of(),
    ExpanseContinuous.of(0, options.size),
  );

  scales.areaPct = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());

  const { x, y, width, height, size, area, areaPct } = scales;

  const opts = { default: true, silent: true };
  const { expandX: ex, expandY: ey } = defaultOptions;

  Expanse.set(area.domain, (e) => (e.ratio = true), opts);
  Expanse.set(size.domain, (e) => (e.ratio = true), opts);
  Expanse.set(size.codomain, (e) => ((e.trans = square), (e.inv = sqrt)), opts);
  Expanse.set(area.codomain, (e) => ((e.trans = square), (e.inv = sqrt)), opts);
  Expanse.set(
    areaPct.codomain,
    (e) => ((e.trans = square), (e.inv = sqrt)),
    opts,
  );

  Expanse.set(x.domain, (e) => ((e.zero = ex), (e.one = 1 - ex)), opts);
  Expanse.set(y.domain, (e) => ((e.zero = ey), (e.one = 1 - ey)), opts);
  Expanse.set(width.domain, (e) => (e.one = 1 - 2 * ex), opts);
  Expanse.set(height.domain, (e) => (e.one = 1 - 2 * ey), opts);
  Expanse.set(area.domain, (e) => (e.one = 1 - 2 * Math.max(ex, ey)), opts);

  // Truncate so e.g. bars cannot have negative height
  const trunc0 = (x: number) => Math.max(x, 0);
  Expanse.set(width.codomain, (e) => (e.inv = trunc0), opts);
  Expanse.set(height.codomain, (e) => (e.inv = trunc0), opts);
}
