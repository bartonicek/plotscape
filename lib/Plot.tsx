import { React } from "./utils/JSX";
import { Expanse, ExpanseContinuous, Scale } from "./main";
import { Frame } from "./Frame";
import { defaultParameters } from "./utils/defaultParameters";
import {
  addTailwind,
  getMargins,
  makeDispatchFn,
  makeListenFn,
  removeTailwind,
} from "./utils/funs";
import { Geom } from "./geoms/Geom";
import { Layers, Margins, Rect } from "./utils/types";

enum Mode {
  Select = "select",
  Pan = "pan",
  Query = "query",
}

enum MouseButton {
  Left = 0,
  Right = 2,
}

type Scales = { x: Scale; y: Scale; size: Scale };
export type Frames = Layers & {
  [key in `base` | `under` | `user` | `xAxis` | `yAxis`]: Frame;
};

type EventType =
  | `resize`
  | `render`
  | `mousedown`
  | `mouseup`
  | `activate`
  | `deactivate`;

export interface Plot {
  container: HTMLElement;
  dispatch: EventTarget;
  frames: Frames;

  scales: Scales;
  geoms: Geom[];

  margins: Margins;
  selectionRect: [x0: number, y0: number, x1: number, y1: number];

  parameters: {
    active: boolean;
    mousedown: boolean;
    mousebutton: MouseButton;
    mode: Mode;
    lastX: number;
    lastY: number;
  };
}

export namespace Plot {
  export function of(): Plot {
    const dispatch = new EventTarget();
    const container = <div class="w-full h-full z-12"></div>;
    const frames = {} as Frames;
    const scales = {} as Scales;
    const geoms = [] as Geom[];
    const parameters = {
      active: false,
      mousedown: false,
      mousebutton: MouseButton.Left,
      mode: Mode.Select,
      lastX: 0,
      lastY: 0,
    };

    const margins = getMargins();
    const selectionRect = [0, 0, 0, 0] as Rect;

    const plot = {
      container,
      dispatch,
      frames,
      parameters,
      scales,
      geoms,
      margins,
      selectionRect,
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
    plot.geoms.push(geom);
    Plot.dispatch(plot, `resize`);
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
    const color = defaultParameters.groupColors[layer % 4];
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
    fillStyle: `#99999933`,
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
  const { container, parameters, frames, selectionRect } = plot;

  window.addEventListener(`resize`, () => Plot.dispatch(plot, `resize`));

  container.addEventListener(`mousedown`, (e) => {
    Plot.dispatch(plot, `activate`);
    parameters.mousedown = true;
    parameters.mousebutton = e.button;

    if (e.button === MouseButton.Left) parameters.mode = Mode.Select;
    else if (e.button === MouseButton.Right) parameters.mode = Mode.Pan;

    const { clientHeight } = container;
    const x = e.offsetX;
    const y = clientHeight - e.offsetY;

    selectionRect[0] = x;
    selectionRect[1] = y;
    selectionRect[2] = x;
    selectionRect[3] = y;

    Frame.clear(frames.user);
  });

  container.addEventListener(`dblclick`, () =>
    Plot.dispatch(plot, `deactivate`)
  );

  container.addEventListener(`contextmenu`, (e) => {
    e.preventDefault();
    parameters.mousedown = true;
    parameters.mousebutton = MouseButton.Right;
    parameters.mode = Mode.Pan;

    parameters.lastX = e.offsetX;
    parameters.lastY = e.offsetY;

    Frame.clear(frames.user);
  });

  container.addEventListener(`mouseup`, () => {
    parameters.mousedown = false;
  });

  container.addEventListener(`mousemove`, (e) => {
    switch (parameters.mode) {
      case Mode.Select:
        select(plot, e);
        break;
      case Mode.Pan:
        pan(plot, e);
        break;
    }
  });

  Plot.listen(plot, `resize`, () => {
    for (const frame of Object.values(plot.frames)) Frame.resize(frame);
    const { clientWidth, clientHeight } = container;
    const { scales, margins } = plot;

    Expanse.set(scales.x.codomain, (e) => {
      e.min = margins[1];
      e.max = clientWidth - margins[3];
    });

    Expanse.set(scales.y.codomain, (e) => {
      e.min = margins[0];
      e.max = clientHeight - margins[2];
    });
  });

  for (const scale of Object.values(plot.scales)) {
    Scale.listen(scale, `changed`, () => Plot.dispatch(plot, `render`));
  }

  Plot.listen(plot, `activate`, () => {
    addTailwind(container, `outline outline-1`);
    plot.parameters.active = true;
  });

  Plot.listen(plot, `deactivate`, () => {
    removeTailwind(container, `outline outline-1`);
    plot.parameters.active = false;
  });

  Plot.listen(plot, `render`, () => {
    for (const frame of Object.values(plot.frames)) Frame.clear(frame);
    for (const geom of plot.geoms) Geom.render(geom, plot.frames);
  });
}

function setupScales(plot: Plot) {
  const { scales, container } = plot;

  const { clientWidth, clientHeight } = container;

  scales.x = Scale.of(Expanse.continuous(), Expanse.continuous(0, clientWidth));
  scales.y = Scale.of(
    Expanse.continuous(),
    Expanse.continuous(0, clientHeight)
  );
  scales.size = Scale.of(Expanse.continuous(), Expanse.continuous());
}

function select(plot: Plot, event: MouseEvent) {
  const { container, frames, selectionRect, parameters } = plot;
  if (!parameters.active || !parameters.mousedown) return;

  const { clientHeight } = container;
  const x = event.offsetX;
  const y = clientHeight - event.offsetY;

  selectionRect[2] = x;
  selectionRect[3] = y;

  Frame.clear(frames.user);
  Frame.rectangleXY(frames.user, ...selectionRect);
}

function pan(plot: Plot, event: MouseEvent) {
  const { container, scales, parameters } = plot;
  if (!parameters.active || !parameters.mousedown) return;

  const { lastX, lastY } = parameters;
  const { clientWidth, clientHeight } = container;

  const x = event.offsetX;
  const y = clientHeight - event.offsetY;
  const xMove = (x - lastX) / clientWidth;
  const yMove = (y - lastY) / clientHeight;

  Scale.move(scales.x, xMove);
  Scale.move(scales.y, yMove);

  parameters.lastX = x;
  parameters.lastY = y;
}
