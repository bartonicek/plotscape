import { React } from "./utils/JSX";
import { Expanse, ExpanseContinuous, Scale } from "./main";
import { Frame } from "./Frame";
import { defaultParameters } from "./utils/defaultParameters";
import { addTailwind, event, getMargins, removeTailwind } from "./utils/funs";
import { ExpanseType } from "./scales/ExpanseType";
import { Geom } from "./geoms/Geom";
import { Margins } from "./utils/types";

export enum Mode {
  Select,
  Pan,
  Query,
}

type Scales = { x: Scale; y: Scale };

export interface Plot {
  container: HTMLElement;
  dispatch: EventTarget;
  frames: Record<string, Frame>;
  margins: Margins;

  scales: Scales;
  geoms: Geom[];

  parameters: {
    active: boolean;
    mousedown: boolean;
  };
}

export namespace Plot {
  export function of(): Plot {
    const dispatch = new EventTarget();
    const container = <div class="w-full h-full z-12"></div>;
    const frames = {};
    const scales = {} as Scales;
    const geoms = [] as Geom[];
    const parameters = { active: false, mousedown: false };
    const margins = getMargins();

    const plot = {
      container,
      dispatch,
      frames,
      margins,
      parameters,
      scales,
      geoms,
    };
    setupFrames(plot);
    setupEvents(plot);
    setupScales(plot);

    return plot;
  }

  export function dispatch(plot: Plot, event: Event) {
    plot.dispatch.dispatchEvent(event);
  }

  export function append(parent: HTMLElement, plot: Plot) {
    parent.appendChild(plot.container);
    Plot.dispatch(plot, event(`resize`));
  }

  export function addGeom(plot: Plot, geom: Geom) {
    plot.geoms.push(geom);
    Plot.dispatch(plot, event(`render`));
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
    canvas.style.zIndex = `${7 - layer + 1}`;

    const frame = Frame.of(canvas);
    const color = defaultParameters.groupColors[layer % 4];
    Frame.setContext(frame, { fillStyle: color, strokeStyle: color });
    frame.margins = margins;

    frames[layer] = frame;
  }

  frames.base = Frame.of(
    <canvas class={def + ` bg-[whitesmoke] z-0`}></canvas>
  );

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
  const { dispatch, container } = plot;

  window.addEventListener(`resize`, () => Plot.dispatch(plot, event(`resize`)));

  container.addEventListener(`click`, () =>
    Plot.dispatch(plot, event(`activate`))
  );

  container.addEventListener(`dblclick`, () =>
    Plot.dispatch(plot, event(`deactivate`))
  );

  dispatch.addEventListener(`resize`, () => {
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

    Plot.dispatch(plot, event(`render`));
  });

  dispatch.addEventListener(`render`, () => {
    for (const geom of plot.geoms) Geom.render(geom, plot.frames[0]);
  });

  dispatch.addEventListener(`activate`, () => {
    addTailwind(container, `outline outline-1`);
    plot.parameters.active = true;
  });

  dispatch.addEventListener(`deactivate`, () => {
    removeTailwind(container, `outline outline-1`);
    plot.parameters.active = false;
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
}
