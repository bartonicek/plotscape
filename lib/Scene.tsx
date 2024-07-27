import { Plot } from "./Plot";
import { Marker } from "./scene/Marker";
import { Dataframe } from "./utils/types";
import { React } from "./main";

export interface Scene<T extends Dataframe = Dataframe> {
  data: T;
  container: HTMLDivElement;
  dispatch: EventTarget;

  rows: number;
  cols: number;

  marker: Marker;
  plots: Plot[];
}

type EventType = `resize`;

export namespace Scene {
  export function of<T extends Dataframe>(data: T): Scene<T> {
    const container = (
      <div class="w-full h-full grid relate bg-[#deded9] grid-rows-1 grid-cols-1 gap-2 p-2"></div>
    ) as HTMLDivElement;
    const plots = [] as Plot[];
    const marker = Marker.of(Object.values(data)[0].length);
    const dispatch = new EventTarget();
    const [rows, cols] = [1, 1];

    const scene = { data, container, rows, cols, dispatch, marker, plots };
    setupEvents(scene);

    return scene;
  }

  export function dispatch(
    scene: Scene,
    type: EventType,
    data?: Record<string, any>
  ) {
    scene.dispatch.dispatchEvent(new CustomEvent(type, { detail: data }));
  }

  export function append(parent: HTMLElement, scene: Scene) {
    parent.appendChild(scene.container);
    Scene.dispatch(scene, `resize`);
  }

  export function addPlot(scene: Scene, plot: Plot) {
    const { container, plots } = scene;
    plots.push(plot);
    container.append(plot.container);

    const nCols = Math.ceil(Math.sqrt(plots.length));
    const nRows = Math.ceil(plots.length / nCols);
    Scene.setDimensions(scene, nRows, nCols);
  }

  export function setDimensions(scene: Scene, rows: number, cols: number) {
    const { container } = scene;
    scene.rows = rows;
    scene.cols = cols;
    container.style.gridTemplateRows = Array(rows).fill(`1fr`).join(` `);
    container.style.gridTemplateColumns = Array(cols).fill(`1fr`).join(` `);
    Scene.dispatch(scene, `resize`);
  }
}

function setupEvents(scene: Scene) {
  const { dispatch, plots, container } = scene;

  dispatch.addEventListener(`resize`, () => {
    for (const plot of plots) Plot.dispatch(plot, `resize`);
  });
}
