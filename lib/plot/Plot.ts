import { Geom } from "../geoms/Geom";
import { Barplot } from "../plots/Barplot";
import { Bibarplot } from "../plots/Bibarplot";
import { Fluctuationplot } from "../plots/Fluctplot";
import { Histogram } from "../plots/Histogram";
import { Histogram2d } from "../plots/Histogram2d";
import { Pcoordsplot } from "../plots/Pcoordsplot";
import { Scatterplot } from "../plots/Scatterplot";
import { Expanse } from "../scales/Expanse";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { Scales } from "../scales/Scales";
import { defaultOptions, GraphicalOptions } from "../scene/defaultOptions";
import { Dataframe } from "../utils/Dataframe";
import { DOM } from "../utils/DOM";
import {
  copyValues,
  diff,
  identity,
  invertRange,
  isDefined,
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
  KeyboardKey,
  MouseButton,
  Rect,
  Representation,
} from "../utils/types";
import { Axes } from "./Axes";
import { CanvasFrame } from "./CanvasFrame";
import { QueryTable } from "./Querytable";
import { Renderer } from "./Renderer";

export type Frames = DataLayers & {
  [key in `base` | `under` | `over` | `user` | `xAxis` | `yAxis`]: CanvasFrame;
};

/**
 * A generic plot object which handles rendering data and reacting to DOM events.
 */
export interface Plot<
  T extends readonly Dataframe[] = readonly Dataframe[],
  U extends Scales = Scales,
> extends Reactive<Plot.Event> {
  type: Plot.Type;
  data: T;
  scales: U;
  representation: Representation;

  container: HTMLElement;
  queryTable?: HTMLTableElement;
  frames: Frames;

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
    ratio: number | undefined;
  };

  options: GraphicalOptions;
}

export namespace Plot {
  export type Mode = `select` | `pan` | `query`;

  export type Type =
    | `unknown`
    | `scatter`
    | `bar`
    | `histo`
    | `histo2d`
    | `fluct`
    | `pcoords`;

  export type Options = {
    id?: string;
    type?: Type;
    renderer?: Renderer.Type;
    representation?: Representation;
    ratio?: number;
  } & Partial<GraphicalOptions>;

  export function of<
    T extends readonly Dataframe[] = readonly Dataframe[],
    U extends Scales = Scales,
  >(data: T, scales: U, options: Options): Plot<T, U> {
    const container = DOM.element(`div`, {
      id: "plot",
      classes: tw("tw-relative tw-h-full tw-w-full tw-drop-shadow-md"),
    });

    data = data ?? [];
    scales = scales ?? Scales.of();
    const frames = {} as Frames;

    const renderables = [] as Geom[];
    const selectables = [] as Geom[];
    const queryables = [] as Geom[];

    options.renderer = options.renderer ?? `canvas`;
    const opts = { ...structuredClone(defaultOptions), ...options };

    // const dataRenderer = createDataRenderer(opts);
    // const auxiliaryRenderer = createAuxiliaryRenderer(opts);

    const { expandX, expandY } = opts;
    const zoomStack = [[expandX, expandY, 1 - expandX, 1 - expandY]] as Rect[];

    const parameters = {
      active: false,
      locked: false,
      mousedown: false,
      mousebutton: MouseButton.Left,
      mode: `select`,
      mousecoords: [0, 0, 0, 0] as Rect,
      lastkey: ``,
      ratio: options?.ratio,
    } as const;

    const type = options.type ?? `unknown`;
    const representation = options.representation ?? `absolute`;

    const plot = Reactive.of()({
      type,
      data,
      container,
      representation,
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
    setupScales(plot);
    setupEvents(plot); // Events need to be setup last

    return plot;
  }

  export type Event =
    | `changed`
    | `reset`
    | `resize`
    | `render`
    | `render-axes`
    | `render-all`
    | `activate`
    | `activated`
    | `deactivate`
    | `deactivated`
    | `lock`
    | `unlock`
    | `clear-transient`
    | `lock-others`
    | `grow`
    | `shrink`
    | `fade`
    | `unfade`
    | `zoom`
    | `pop-zoom`
    | `query-mode`
    | `normalize`
    | `get-scale`
    | `get-parameters`
    | `set-selected`
    | `set-scale`
    | `set-parameters`
    | `reorder`
    | `increment-anchor`
    | `decrement-anchor`
    | KeyboardKey;

  export const scatter = Scatterplot;
  export const bar = Barplot;
  export const fluct = Fluctuationplot;
  export const histo = Histogram;
  export const histo2d = Histogram2d;
  export const pcoords = Pcoordsplot;
  export const bibar = Bibarplot;

  export function append(parent: HTMLElement, plot: Plot) {
    parent.appendChild(plot.container);
    Plot.resize(plot);
  }

  export function addGeom(plot: Plot, geom: Geom) {
    const { renderables, selectables, queryables } = plot;
    for (const e of [renderables, selectables, queryables]) {
      e.push(geom);
    }

    for (const r of renderables) Reactive.removeAll(r, `coords-changed`);
    Reactive.listenAll(renderables, `coords-changed`, () => Plot.render(plot));
  }

  export function deleteGeom(plot: Plot, geom: Geom) {
    const { renderables, selectables, queryables } = plot;
    for (const e of [renderables, selectables, queryables]) {
      remove(e, geom);
    }

    Reactive.removeAllListeners(geom);
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
    for (const layer of dataLayers) CanvasFrame.clear(plot.frames[layer]);
    for (const geom of plot.renderables) Geom.render(geom, plot.frames);
  }

  export function renderAxes(plot: Plot) {
    Axes.renderLabels(plot);
    Axes.renderTitles(plot);
  }

  export function clearUserFrame(plot: Plot) {
    CanvasFrame.clear(plot.frames.user);
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

    for (const frame of Object.values(plot.frames)) CanvasFrame.resize(frame);

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

  export function checkSelection(plot: Plot, coords?: Rect) {
    const { selectables, parameters } = plot;
    coords = coords ?? parameters.mousecoords;
    const selectedCases = new Set<number>();

    for (const geom of selectables) {
      const selected = Geom.check(geom, coords);
      for (let i = 0; i < selected.length; i++) selectedCases.add(selected[i]);
    }

    const cases = Array.from(selectedCases);
    Reactive.dispatch(plot, `set-selected`, { cases });
  }

  export function selectRegion(
    plot: Plot,
    coords: [any, any, any, any],
    options?: { units?: `data` | `screen` | `pct` },
  ) {
    const { frames, scales, options: opts } = plot;
    const { margins } = opts;
    const units = options?.units ?? `pct`;

    if (units === `screen`) {
      coords[0] += margins[1];
      coords[1] += margins[0];
      coords[2] += margins[1];
      coords[3] += margins[0];
    } else if (units === `pct`) {
      coords[0] = Expanse.unnormalize(scales.x.codomain, coords[0]);
      coords[1] = Expanse.unnormalize(scales.y.codomain, coords[1]);
      coords[2] = Expanse.unnormalize(scales.x.codomain, coords[2]);
      coords[3] = Expanse.unnormalize(scales.y.codomain, coords[3]);
    } else if (units === `data`) {
      coords[0] = Scale.pushforward(scales.x, coords[0]);
      coords[1] = Scale.pushforward(scales.y, coords[1]);
      coords[2] = Scale.pushforward(scales.x, coords[2]);
      coords[3] = Scale.pushforward(scales.y, coords[3]);
    }

    checkSelection(plot, coords);
    Plot.clearUserFrame(plot);
    CanvasFrame.rectangleXY(frames.user, ...coords, 1);
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

    const { mousecoords } = parameters;
    const { clientHeight } = container;
    const x = event.offsetX;
    const y = clientHeight - event.offsetY;

    mousecoords[2] = x;
    mousecoords[3] = y;

    Plot.checkSelection(plot);
    Reactive.dispatch(plot, `lock-others`);
    Plot.clearUserFrame(plot);
    CanvasFrame.rectangleXY(frames.user, ...parameters.mousecoords, 1);
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

    Reactive.dispatch(plot, `clear-transient`);
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
    const { area: a, size: sz, width: w } = plot.scales;
    const k = 10 / 9;

    // Silent to avoid unnecessary re-renders
    const opts = { silent: true };
    Expanse.set(a.codomain, (s) => ({ min: s.min * k, max: s.max * k }), opts);
    Expanse.set(sz.codomain, (s) => ({ min: s.min * k, max: s.max * k }), opts);
    Expanse.set(
      w.codomain,
      (s) => (s.mult < 1 ? { mult: s.mult * k } : {}),
      opts,
    );

    Plot.render(plot);
  }

  export function shrink(plot: Plot) {
    const { area: a, size: s, width: w } = plot.scales;
    const k = 9 / 10;

    // Silent to avoid unnecessary re-renders
    const opts = { silent: true };
    Expanse.set(a.codomain, (e) => ({ min: e.min * k, max: e.max * k }), opts);
    Expanse.set(s.codomain, (e) => ({ min: e.min * k, max: e.max * k }), opts);
    Expanse.set(w.codomain, (e) => ({ mult: (e.mult * 9) / 10 }), opts);

    Plot.render(plot);
  }

  export function fade(plot: Plot) {
    const { frames } = plot;
    for (const layer of baseLayers) {
      CanvasFrame.setAlpha(frames[layer], (a) => (a * 9) / 10);
    }
    Plot.render(plot);
  }

  export function unfade(plot: Plot) {
    const { frames } = plot;
    for (const layer of baseLayers) {
      CanvasFrame.setAlpha(frames[layer], (a) => (a * 10) / 9);
    }
    Plot.render(plot);
  }

  export function reset(plot: Plot) {
    const { frames, scales } = plot;

    for (const layer of baseLayers) CanvasFrame.resetAlpha(frames[layer]);
    for (const scale of Object.values(scales)) Scale.restore(scale);

    plot.zoomStack.length = 1;
    Plot.clearUserFrame(plot);
  }

  export function setQueryMode(plot: Plot) {
    Plot.setMode(plot, `query`);
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

      x0 = Expanse.normalize(x.domain, x0) as number;
      x1 = Expanse.normalize(x.domain, x1) as number;
      y0 = Expanse.normalize(y.domain, y0) as number;
      y1 = Expanse.normalize(y.domain, y1) as number;
    }

    // Normalize within screen coordinates
    if (units === `screen`) {
      // If zoom area is too tiny, do nothing
      if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) return;

      x0 = trunc(Expanse.normalize(x.codomain, x0) as number);
      x1 = trunc(Expanse.normalize(x.codomain, x1) as number);
      y0 = trunc(Expanse.normalize(y.codomain, y0) as number);
      y1 = trunc(Expanse.normalize(y.codomain, y1) as number);
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

    const [scale, other] = xRatio < yRatio ? [x, y] : [y, x];
    let r = scale === x ? xRatio / yRatio : yRatio / xRatio;
    r = r * Scale.unitRange(scale);
    const [zero, one] = [(1 - r) / 2, (1 + r) / 2];

    Scale.set(other, () => ({ zero, one }), opts);
  }

  export function getScale(plot: Plot, scale: Exclude<keyof Scales, symbol>) {
    return plot.scales[scale];
  }

  interface ScaleOpts {
    min?: number;
    max?: number;
    trans?: (x: number) => number;
    inv?: (x: number) => number;
    // A single string identifier for transformation (instead of trans + inv)
    transformation?: `log10` | `sqrt`;
    labels?: string[];
    zero?: number;
    one?: number;
    mult?: number;
    direction?: Direction;
    default?: boolean;
    unfreeze?: boolean;
  }

  export function setScale(
    plot: Plot,
    scale: keyof Scales,
    options: ScaleOpts,
  ) {
    if (!Object.keys(plot.scales).includes(scale)) {
      throw new Error(`Unrecognized scale '${scale}'`);
    }

    const targetScale = plot.scales[scale];
    const domain = targetScale.domain;
    const opts = {
      default: options.default ?? false,
      unfreeze: options.unfreeze ?? false,
    };

    let { zero, one } = options;

    if ([zero, one].some(isDefined)) {
      zero = zero ?? targetScale.props.zero;
      one = one ?? targetScale.props.one;

      Scale.set(targetScale, () => ({ zero, one }), opts);
      plot.parameters.ratio = undefined;
    }

    let { min, max } = options;

    if ([min, max].some(isDefined)) {
      if (!Expanse.isContinuous(domain)) {
        throw new Error(`Limits can only be set with a continuous domain`);
      }

      // If we're setting either min or max manually, clear zero
      zero = isDefined(min) ? (zero ?? 0) : targetScale.props.zero;
      one = isDefined(max) ? (one ?? 1) : targetScale.props.one;
      min = min ?? domain.props.min;
      max = max ?? domain.props.max;

      Expanse.set(domain, () => ({ min, max }), opts);
      Scale.set(targetScale, () => ({ zero, one }), opts);
      plot.parameters.ratio = undefined;
    }

    const { transformation: t } = options;
    let { trans, inv } = t ? ExpanseContinuous.transformations[t] : options;

    if ([trans, inv].some(isDefined)) {
      if (!Expanse.isContinuous(domain)) {
        throw new Error(
          `Transformations can only be set with a continuous domain`,
        );
      }

      trans = trans ?? identity;
      inv = inv ?? identity;

      Expanse.set(domain, () => ({ trans, inv }), opts);
    }

    const { labels } = options;

    if (labels) {
      if (!Expanse.isDiscrete(domain)) {
        throw new Error(`Labels can be ordered with a discrete domain only`);
      }

      if (!stringArraysMatch(domain.props.labels, labels)) {
        throw new Error(`Labels must match the scale's labels`);
      }

      const indices = orderIndicesByTable(domain.props.labels, labels);
      Expanse.reorder(domain, indices);
    }

    let { mult, direction } = options;
    if (direction) Scale.set(targetScale, () => ({ direction }), opts);
    if (mult) Scale.set(targetScale, () => ({ mult }), opts);
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
    const style = { zIndex: `${7 - layer + 2}` };
    const color = colors[layer];
    const context = { fillStyle: color, strokeStyle: color };
    const frame = CanvasFrame.of({ classes, style, context, margins });
    frames[layer] = frame;
  }

  const base = CanvasFrame.of({ classes });
  CanvasFrame.setContext(base, {
    font: `${ts}em ${options.axisTitleFont}`,
    textBaseline: `middle`,
    textAlign: `center`,
  });
  DOM.setStyles(base.canvas, { background: options.marginBackground });

  // Have to use base CSS here too (because of dynamic variables)
  const width = `calc(100% - ${left}px - ${right}px)`;
  const height = `calc(100% - ${bottom}px - ${top}px)`;
  const styles = { width, height, top: top + `px`, right: right + `px` };
  const under = CanvasFrame.of({ classes: classes + "tw-z-1", style: styles });
  DOM.setStyles(under.canvas, { background: options.plotBackground });

  const overClasses = "tw-z-10 tw-border tw-border-b-black tw-border-l-black";
  const over = CanvasFrame.of({
    classes: classes + overClasses,
    style: styles,
  });

  const user = CanvasFrame.of({ classes: classes + "tw-z-10", margins });
  CanvasFrame.setContext(user, { globalAlpha: 1 / 15 });

  const fillStyle = `#3B4854`;

  const xAxis = CanvasFrame.of({ classes: classes });
  CanvasFrame.setContext(xAxis, {
    fillStyle,
    textBaseline: `top`,
    textAlign: `center`,
    font: `${ls}em ${options.axisTextFont}`,
  });

  const yAxis = CanvasFrame.of({ classes: classes });
  CanvasFrame.setContext(yAxis, {
    fillStyle: `#3B4854`,
    textBaseline: `middle`,
    textAlign: `right`,
    font: `${ls}em ${options.axisTextFont}`,
  });

  Object.assign(frames, { base, under, over, user, xAxis, yAxis });

  for (let [k, v] of Object.entries(frames)) {
    if (!isNaN(parseFloat(k))) k = `data-` + k;
    v.canvas.id = `frame-${k}`;
    CanvasFrame.append(v, container);
  }
}

function setupEvents(plot: Plot) {
  const { container, parameters } = plot;
  const { mousecoords } = parameters;

  for (const [k, v] of Object.entries(Plot.keybindings)) {
    Reactive.listen(plot, k as KeyboardKey, () => Reactive.dispatch(plot, v));
  }

  container.addEventListener(`mousedown`, (e) => {
    const { locked } = parameters;

    Plot.activate(plot);
    Plot.setMousedown(plot, true);
    Plot.setMouseButton(plot, e.button as MouseButton);

    if (e.button === MouseButton.Left) {
      Plot.setMode(plot, `select`);
    } else if (e.button === MouseButton.Right) {
      Plot.setMode(plot, `pan`);
    }

    const x = e.offsetX;
    const y = container.clientHeight - e.offsetY;

    copyValues([x, y, x, y], mousecoords);

    if (!locked && parameters.mode === `select`) {
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
    Plot.setMode(plot, `pan`);

    mousecoords[0] = e.offsetX;
    mousecoords[1] = container.clientHeight - e.offsetY;

    Plot.clearUserFrame(plot);
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
  Reactive.listen(plot, `query-mode`, () => Plot.setMode(plot, `query`));
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

  Reactive.listen(plot, `grow`, () => Plot.grow(plot), { throttle: 10 });
  Reactive.listen(plot, `shrink`, () => Plot.shrink(plot), { throttle: 10 });
  Reactive.listen(plot, `fade`, () => Plot.fade(plot), { throttle: 10 });
  Reactive.listen(plot, `unfade`, () => Plot.unfade(plot), { throttle: 10 });
  Reactive.listen(plot, `zoom`, (data) => Plot.zoom(plot, data));
  Reactive.listen(plot, `pop-zoom`, () => Plot.popZoom(plot));

  for (const scale of Object.values(plot.scales)) {
    Reactive.listen(scale, `changed`, () => {
      Plot.render(plot), Plot.renderAxes(plot);
    });
  }
}

function setupScales(plot: Plot) {
  const { scales } = plot;
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

  // Truncate so that e.g. bars cannot have negative height or width
  const trunc0 = (x: number) => Math.max(x, 0);
  Expanse.set(width.codomain, () => ({ inv: trunc0 }), opts);
  Expanse.set(height.codomain, () => ({ inv: trunc0 }), opts);
}

// function createDataRenderer(options: GraphicalOptions) {
//   const { margins, colors } = options;

//   const dataLayers = [7, 6, 5, 4, 3, 2, 1, 0] as const;
//   const classes = "tw-absolute tw-top-0 tw-right-0 tw-w-full tw-h-full "; // Default Tailwind classes
//   const config = {} as Record<string, any>;

//   for (const layer of dataLayers) {
//     const color = colors[layer];
//     // Have to use base CSS for z-index: Tailwind classes cannnot be generated dynamically
//     const style = { zIndex: `${7 - layer + 2}` };
//     const props = { fillStyle: color, strokeStyle: color };
//     config[layer] = { classes, style, props, margins };
//   }

//   return CanvasRenderer.of(config);
// }

// function createAuxiliaryRenderer(options: GraphicalOptions) {
//   const { margins, axisLabelSize: ls, axisTitleSize: ts } = options;
//   const [bottom, left, top, right] = margins;

//   // Default Tailwind classes
//   const classes = "tw-absolute tw-top-0 tw-right-0 tw-w-full tw-h-full ";

//   // Have to use vanilla CSS here because of dynamic variables
//   const width = `calc(100% - ${left}px - ${right}px)`;
//   const height = `calc(100% - ${bottom}px - ${top}px)`;
//   const innerStyle = { width, height, top: top + `px`, right: right + `px` };

//   const config: Record<string, CanvasFrame.Options> = {
//     base: {
//       classes,
//       style: { background: options.marginBackground },
//       context: {
//         font: `${ts}em ${options.axisTitleFont}`,
//         textBaseline: `middle`,
//         textAlign: `center`,
//       },
//     },
//     under: {
//       classes: classes + `tw-z-1`,
//       style: { ...innerStyle, backgroundColor: options.plotBackground },
//     },
//     over: {
//       classes:
//         classes + `tw-z-10 tw-border tw-border-b-black tw-border-l-black`,
//       style: innerStyle,
//     },
//     user: {
//       classes: classes + `tw-z-10`,
//       margins,
//       context: { globalAlpha: 1 / 15 },
//     },
//     xAxis: {
//       classes,
//       context: {
//         fillStyle: `#3B4854`,
//         textBaseline: `top`,
//         textAlign: `center`,
//         font: `${ls}em ${options.axisTextFont}`,
//       },
//     },
//     yAxis: {
//       classes,
//       context: {
//         fillStyle: `#3B4854`,
//         textBaseline: `middle`,
//         textAlign: `right`,
//         font: `${ls}em ${options.axisTextFont}`,
//       },
//     },
//   };

//   return CanvasRenderer.of(config);
// }
