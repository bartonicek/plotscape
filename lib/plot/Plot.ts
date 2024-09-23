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
import { Dataframe } from "../utils/Dataframe";
import { DOM } from "../utils/DOM";
import {
  copyValues,
  diff,
  invertRange,
  isDefined,
  last,
  max,
  orderIndicesByTable,
  rangeInverse,
  remove,
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
  dataLayers,
  DataLayers,
  Direction,
  MouseButton,
  Rect,
} from "../utils/types";
import { renderAxisLabels, renderAxisTitles } from "./axes";
import { Frame } from "./Frame";
import { QueryTable } from "./Querytable";

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
  frames: Frames;
  queryTable?: HTMLTableElement;

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

    const container = DOM.element(`div`, {
      id: "plot",
      classes: tw("tw-relative tw-h-full tw-w-full tw-drop-shadow-md"),
    });

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

  const activeClasses = tw("tw-outline tw-outline-2 tw-outline-slate-600");

  export function activate(plot: Plot) {
    DOM.addClasses(plot.container, activeClasses);
    plot.parameters.active = true;
    Reactive.dispatch(plot, `activated`);
  }

  export function deactivate(plot: Plot) {
    DOM.removeClasses(plot.container, activeClasses);
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
    const { container, scales, frames, parameters, options } = plot;
    const { clientWidth, clientHeight } = container;
    const { x, y, width, height, area } = scales;
    const { margins, marginLines } = options;

    const styles = getComputedStyle(plot.container);
    const em = parseFloat(styles.fontSize);

    for (let i = 0; i < margins.length; i++) {
      margins[i] = marginLines[i] * em;
    }

    for (const frame of Object.values(plot.frames)) Frame.resize(frame);

    const [bottom, left] = [margins[0], margins[1]];
    const [top, right] = [clientHeight - margins[2], clientWidth - margins[3]];

    DOM.setStyles(frames.under.canvas, {
      width: `calc(100% - ${left}px - ${margins[3]}px)`,
      height: `calc(100% - ${bottom}px - ${margins[2]}px)`,
      top: `${margins[2]}px`,
      right: `${margins[3]}px`,
    });

    DOM.setStyles(frames.over.canvas, {
      width: `calc(100% - ${left}px - ${margins[3]}px)`,
      height: `calc(100% - ${bottom}px - ${margins[2]}px)`,
      top: `${margins[2]}px`,
      right: `${margins[3]}px`,
    });

    const opts = { default: true, silent: true }; // Silent to avoid re-renders
    Expanse.set(x.codomain, () => ({ min: left, max: right }), opts);
    Expanse.set(y.codomain, () => ({ min: bottom, max: top }), opts);

    const [w, h] = [right - left, top - bottom];

    Expanse.set(width.codomain, () => ({ max: w }), opts);
    Expanse.set(height.codomain, () => ({ max: h }), opts);
    Expanse.set(area.codomain, () => ({ max: Math.min(w, h) }), opts);

    if (parameters.ratio) {
      const { expandX: ex, expandY: ey } = defaultOptions;
      Scale.set(x, () => ({ zero: ex, one: 1 - ex }), opts);
      Scale.set(y, () => ({ zero: ey, one: 1 - ey }), opts);
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
    const { queryTable, queryables, container } = plot;
    const { clientHeight } = container;

    if (!queryTable) return;

    DOM.setStyles(queryTable, { display: `none` });
    const [x, y] = [offsetX, clientHeight - offsetY];

    let result: Record<string, any> | undefined;
    for (const geom of queryables) {
      result = Geom.query(geom, [x, y]);
      if (result) break;
    }

    if (!result) return;

    QueryTable.formatQueryTable(queryTable, result);
    queryTable.style.display = `inline-block`;
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
    const k = 10 / 9;

    Expanse.set(area.codomain, (e) => ({ min: e.min * k, max: e.max * k }));
    Expanse.set(size.codomain, (e) => ({ min: e.min * k, max: e.max * k }));

    Expanse.set(width.codomain, (e) =>
      e.mult < 1 ? { mult: (e.mult * 10) / 9 } : {},
    );
  }

  export function shrink(plot: Plot) {
    const { area, width, size } = plot.scales;
    const k = 9 / 10;

    Expanse.set(area.codomain, (e) => ({ min: e.min * k, max: e.max * k }));
    Expanse.set(size.codomain, (e) => ({ min: e.min * k, max: e.max * k }));
    Expanse.set(width.codomain, (e) => ({ mult: (e.mult * 9) / 10 }));
  }

  export function fade(plot: Plot) {
    const { frames } = plot;
    for (const l of baseLayers) {
      Frame.setAlpha(frames[l], (a) => (a * 9) / 10);
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
    for (const scale of Object.values(scales)) Scale.restore(scale);

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
      Scale.set(x, () => ({ zero: 0, one: 1 }), opts);
      Scale.set(y, () => ({ zero: 0, one: 1 }), opts);

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

    const { width, height, area, size } = scales;

    if (width.codomain !== area.codomain) {
      Expanse.set(width.codomain, (e) => ({ max: e.max * xStretch }));
    }

    if (height.codomain !== area.codomain) {
      Expanse.set(height.codomain, (e) => ({ max: e.max * yStretch }));
    }

    Expanse.set(area.codomain, (e) => ({ max: e.max * areaStretch }));
    Expanse.set(size.codomain, (e) => ({ max: e.max * areaStretch }));

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

    const { width, height, area, size } = scales;

    if (width.codomain !== area.codomain) {
      Expanse.set(width.codomain, (e) => ({ max: e.max * xStretch }));
    }

    if (height.codomain !== area.codomain) {
      Expanse.set(height.codomain, (e) => ({ max: e.max * yStretch }));
    }

    Expanse.set(area.codomain, (e) => ({ max: e.max * areaStretch }));
    Expanse.set(size.codomain, (e) => ({ max: e.max * areaStretch }));

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
      const r = (yRatio / xRatio) * Scale.unitRange(y);
      const [zero, one] = [(1 - r) / 2, (1 + r) / 2];
      Scale.set(x, () => ({ zero, one }), opts);
    } else {
      const r = (xRatio / yRatio) * Scale.unitRange(x);
      const [zero, one] = [(1 - r) / 2, (1 + r) / 2];
      Scale.set(y, () => ({ zero, one }), opts);
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
    scale: keyof Scales,
    options: {
      min?: number;
      max?: number;
      labels?: string[];
      zero?: number;
      one?: number;
      mult?: number;
      direction?: Direction;
      default?: boolean;
      unfreeze?: boolean;
    },
  ) {
    let { min, max, zero, one, mult, labels, direction } = options;
    const s = plot.scales[scale];
    const domain = s.domain;
    const codomain = s.codomain;

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

      Scale.set(s, () => ({ zero, one }), opts);
      plot.parameters.ratio = undefined;
    }

    if ([min, max].some(isDefined)) {
      if (!Expanse.isContinuous(domain)) {
        throw new Error(`Limits can only be set with a continuous domain`);
      }

      min = min ?? domain.props.min;
      max = max ?? domain.props.max;

      Expanse.set(domain, () => ({ min, max }), opts);
      Scale.set(s, () => ({ zero: 0, one: 1 }), opts);
      plot.parameters.ratio = undefined;
    }

    if (labels) {
      if (!Expanse.isDiscrete(domain)) {
        throw new Error(`Labels can be ordered with a discrete domain only`);
      }

      if (!stringArraysMatch(domain.labels, labels)) {
        throw new Error(`Labels must match the scale's labels`);
      }

      const indices = orderIndicesByTable(domain.labels, labels);
      Expanse.reorder(domain, indices);
    }

    if (direction) Scale.set(s, () => ({ direction }), opts);
    if (mult) Expanse.set(codomain, () => ({ mult }), opts);
  }
}

function setupFrames(plot: Plot, options: GraphicalOptions) {
  const { container, frames } = plot;
  const { margins, colors, axisLabelSize: ls, axisTitleSize: ts } = options;

  const [bottom, left, top, right] = margins;
  const dataLayers = [7, 6, 5, 4, 3, 2, 1, 0] as const;

  const classes = "tw-absolute tw-top-0 tw-right-0 tw-w-full tw-h-full "; // Default Tailwind classes

  for (const layer of dataLayers) {
    // Have to use base CSS for z-index: Tailwind classes cannnot be generated dynamically
    const canvasStyles = { zIndex: `${7 - layer + 2}` };
    const color = colors[layer];
    const contextProps = { fillStyle: color, strokeStyle: color };

    const frame = Frame.of({ classes, contextProps, canvasStyles, margins });
    frames[layer] = frame;
  }

  const base = Frame.of({ classes: classes + "tw-bg-gray-100" });
  Frame.setContext(base, {
    font: `${ts}em sans-serif`,
    textBaseline: `middle`,
    textAlign: `center`,
  });

  // Have to use base CSS here too (because of dynamic variables)
  const width = `calc(100% - ${left}px - ${right}px)`;
  const height = `calc(100% - ${bottom}px - ${top}px)`;
  const canvasStyles = { width, height, top: top + `px`, right: right + `px` };
  const under = Frame.of({
    classes: classes + "tw-z-1 tw-bg-white",
    canvasStyles,
  });

  const overClasses = "tw-z-10 tw-border tw-border-b-black tw-border-l-black";
  const over = Frame.of({ classes: classes + overClasses, canvasStyles });

  const user = Frame.of({ classes: classes + "tw-z-10", margins });
  Frame.setContext(user, { globalAlpha: 1 / 15 });

  const fillStyle = `#3B4854`;

  const xAxis = Frame.of({ classes: classes });
  Frame.setContext(xAxis, {
    fillStyle,
    textBaseline: `top`,
    textAlign: `center`,
    font: `${ls}em serif`,
  });

  const yAxis = Frame.of({ classes: classes });
  Frame.setContext(yAxis, {
    fillStyle: `#3B4854`,
    textBaseline: `middle`,
    textAlign: `right`,
    font: `${ls}em serif`,
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
  scales.height = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());
  scales.width = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());
  scales.area = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());
  scales.size = Scale.of(
    ExpanseContinuous.of(),
    ExpanseContinuous.of(0, options.size),
  );

  scales.areaPct = Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());

  const { x, y, width, height, size, area, areaPct } = scales;

  const opts = { default: true, silent: true };
  const { expandX: ex, expandY: ey } = defaultOptions;

  Expanse.set(area.domain, () => ({ ratio: true }), opts);
  Expanse.set(areaPct.domain, () => ({ ratio: true }), opts);
  Expanse.set(size.domain, () => ({ ratio: true }), opts);
  Expanse.set(size.codomain, () => ({ trans: square, inv: sqrt }), opts);
  Expanse.set(area.codomain, () => ({ trans: square, inv: sqrt }), opts);
  Expanse.set(areaPct.codomain, () => ({ trans: square, inv: sqrt }), opts);

  Scale.set(x, () => ({ zero: ex, one: 1 - ex }), opts);
  Scale.set(y, () => ({ zero: ey, one: 1 - ey }), opts);
  Scale.set(width, () => ({ one: 1 - 2 * ex }), opts);
  Scale.set(height, () => ({ one: 1 - 2 * ey }), opts);
  Scale.set(area, () => ({ one: 1 - 2 * Math.max(ex, ey) }), opts);

  // Truncate so e.g. bars cannot have negative height
  const trunc0 = (x: number) => Math.max(x, 0);
  Expanse.set(width.codomain, () => ({ inv: trunc0 }), opts);
  Expanse.set(height.codomain, () => ({ inv: trunc0 }), opts);
}
