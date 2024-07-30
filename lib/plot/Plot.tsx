import { Geom } from "../geoms/Geom";
import { Expanse, ExpanseContinuous, Scale } from "../main";
import { colors, defaultParameters } from "../utils/defaultParameters";
import {
  addTailwind,
  getMargins,
  makeDispatchFn,
  makeListenFn,
  removeTailwind,
  sqrt,
  square,
  throttle,
} from "../utils/funs";
import { React } from "../utils/JSX";
import { dataLayers, Layers, Margins, Rect } from "../utils/types";
import { renderAxisLabels } from "./axes";
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
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
  area: Scale<any, ExpanseContinuous>;
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
  | `selected`
  | `clicked-active`;

export enum PlotType {
  unknown = `unknown`,
  scatter = `scatter`,
  bar = `bar`,
}

export interface Plot {
  type: PlotType;

  container: HTMLElement;
  dispatch: EventTarget;
  frames: Frames;

  scales: Scales;
  geoms: Geom[];
  margins: Margins;

  parameters: {
    active: boolean;
    mode: Mode;
    mousedown: boolean;
    mousebutton: MouseButton;
    mousecoords: Rect;
  };
}

export namespace Plot {
  export function of(): Plot {
    const type = PlotType.unknown;
    const container = <div class="relative w-full h-full z-12"></div>;
    const dispatch = new EventTarget();

    const frames = {} as Frames;
    const scales = {} as Scales;
    const geoms = [] as Geom[];

    const parameters = {
      active: false,
      mousedown: false,
      mousebutton: MouseButton.Left,
      mode: Mode.Select,
      mousecoords: [0, 0, 0, 0] as Rect,
    };

    const margins = getMargins();

    const plot = {
      type,
      container,
      dispatch,
      frames,
      scales,
      geoms,
      parameters,
      margins,
    };

    setupFrames(plot);
    setupScales(plot);
    setupEvents(plot); // Need to set up events last

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
}

function setupFrames(plot: Plot) {
  const { container, frames } = plot;
  const margins = getMargins();
  const dataLayers = [0, 1, 2, 3, 4, 5, 6, 7] as const;

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
  frames.under = Frame.of(
    <canvas
      class={def + ` bg-white z-1 border border-l-black border-b-black`}
    ></canvas>
  );

  frames.under.canvas.style.width = `calc(100% - ${margins[1]}px - ${margins[3]}px)`;
  frames.under.canvas.style.height = `calc(100% - ${margins[0]}px - ${margins[2]}px)`;
  frames.under.canvas.style.top = margins[2] + `px`;
  frames.under.canvas.style.right = margins[3] + `px`;

  frames.user = Frame.of(<canvas class={def + ` z-10`}></canvas>);
  frames.user.margins = margins;
  Frame.setContext(frames.user, {
    fillStyle: `#9999991E`,
    strokeStyle: `#00000000`,
  });

  frames.xAxis = Frame.of(<canvas class={def}></canvas>);
  Frame.setContext(frames.xAxis, {
    fillStyle: `#3B4854`,
    textBaseline: `top`,
    textAlign: `center`,
    font: `${defaultParameters.axisLabelFontsize}px serif`,
  });

  frames.yAxis = Frame.of(<canvas class={def}></canvas>);
  Frame.setContext(frames.yAxis, {
    fillStyle: `#3B4854`,
    textBaseline: `middle`,
    textAlign: `right`,
    font: `${defaultParameters.axisLabelFontsize}px serif`,
  });

  for (let [k, v] of Object.entries(frames)) {
    if (!isNaN(parseFloat(k))) k = `data-` + k;
    v.canvas.id = `frame-${k}`;
    Frame.append(v, container);
  }
}

function setupEvents(plot: Plot) {
  const { container, parameters, frames } = plot;
  const { mousecoords } = parameters;

  window.addEventListener(`resize`, () => Plot.dispatch(plot, `resize`));
  window.addEventListener(`keydown`, (e) => keydownHandlers[e.code]?.(plot));

  container.addEventListener(`mousedown`, (e) => {
    if (parameters.active) Plot.dispatch(plot, `clicked-active`);
    Plot.dispatch(plot, `activate`);
    parameters.mousedown = true;
    parameters.mousebutton = e.button;

    if (e.button === MouseButton.Left) parameters.mode = Mode.Select;
    else if (e.button === MouseButton.Right) parameters.mode = Mode.Pan;

    const { clientHeight } = container;
    const x = e.offsetX;
    const y = clientHeight - e.offsetY;

    mousecoords[0] = x;
    mousecoords[1] = y;
    mousecoords[2] = x;
    mousecoords[3] = y;

    Frame.clear(frames.user);
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
    throttle((e) => mousemoveHandlers[parameters.mode](plot, e), 10)
  );

  Plot.listen(plot, `resize`, () => {
    for (const frame of Object.values(plot.frames)) Frame.resize(frame);
    const { scales, margins } = plot;
    const { clientWidth, clientHeight } = container;
    const { x, y } = scales;

    const [bottom, left] = [margins[0], margins[1]];
    const [top, right] = [clientHeight - margins[2], clientWidth - margins[3]];
    const opts = { default: true };

    Expanse.set(x.codomain, (e) => ((e.min = left), (e.max = right)), opts);
    Expanse.set(y.codomain, (e) => ((e.min = bottom), (e.max = top)), opts);
  });

  for (const scale of Object.values(plot.scales)) {
    Scale.listen(scale, `changed`, () => {
      Plot.dispatch(plot, `render`);
      Plot.dispatch(plot, `render-axes`);
    });
  }

  Plot.listen(plot, `activate`, () => {
    addTailwind(container, `outline outline-[1px]`);
    plot.parameters.active = true;
  });

  Plot.listen(plot, `deactivate`, () => {
    removeTailwind(container, `outline outline-[1px]`);
    plot.parameters.active = false;
  });

  Plot.listen(plot, `render`, () => {
    for (const layer of dataLayers) Frame.clear(frames[layer]);
    for (const geom of plot.geoms) Geom.render(geom, plot.frames);
  });

  Plot.listen(plot, `render-axes`, () => {
    for (const layer of [`xAxis`, `yAxis`] as const) Frame.clear(frames[layer]);
    renderAxisLabels(plot, `x`);
    renderAxisLabels(plot, `y`);
  });
}

function setupScales(plot: Plot) {
  const { scales, container } = plot;
  const { clientWidth: width, clientHeight: height } = container;

  scales.x = Scale.of(Expanse.continuous(), Expanse.continuous(0, width));
  scales.y = Scale.of(Expanse.continuous(), Expanse.continuous(0, height));
  scales.area = Scale.of(Expanse.continuous(), Expanse.continuous(0, 5));

  const { x, y, area } = scales;

  x.other = y;
  y.other = x;

  const opts = { default: true, silent: true };
  const { expandX: ex, expandY: ey } = defaultParameters;

  Expanse.set(x.domain, (e) => ((e.zero = ex), (e.one = 1 - ex)), opts);
  Expanse.set(y.domain, (e) => ((e.zero = ey), (e.one = 1 - ey)), opts);

  Expanse.set(area.domain, (e) => (e.ratio = true), opts);
  Expanse.set(area.codomain, (e) => ((e.trans = square), (e.inv = sqrt)), opts);
}

const mousemoveHandlers = { select, pan, query };

function select(plot: Plot, event: MouseEvent) {
  const { container, frames, geoms, parameters } = plot;
  if (!parameters.active || !parameters.mousedown) return;

  const { mousecoords } = parameters;
  const { clientHeight } = container;
  const x = event.offsetX;
  const y = clientHeight - event.offsetY;

  mousecoords[2] = x;
  mousecoords[3] = y;

  const selectedCases = new Set<number>();

  for (const geom of geoms) {
    const selected = Geom.check(geom, mousecoords);
    for (let i = 0; i < selected.length; i++) selectedCases.add(selected[i]);
  }

  Plot.dispatch(plot, `selected`, { selected: Array.from(selectedCases) });

  Frame.clear(frames.user);
  Frame.rectangleXY(frames.user, ...mousecoords);
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
}

function query() {}

const keydownHandlers: Record<string, (plot: Plot) => void> = { KeyR: reset };

function reset(plot: Plot) {
  for (const scale of Object.values(plot.scales)) Scale.restoreDefaults(scale);
  Plot.dispatch(plot, `render`);
}
