import { Plot } from "../Plot";
import { Marker } from "./Marker";
import { Dataframe } from "../utils/types";
import { Plots, React } from "../main";
import { makeDispatchFn, makeListenFn } from "../utils/funs";

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
      <div class="w-full h-full grid relate bg-[#deded9] grid-rows-1 grid-cols-1 gap-2 p-3"></div>
    ) as HTMLDivElement;
    const plots = [] as Plot[];
    const marker = Marker.of(Object.values(data)[0].length);
    const dispatch = new EventTarget();
    const [rows, cols] = [1, 1];

    const scene = { data, container, rows, cols, dispatch, marker, plots };
    setupEvents(scene);

    return scene;
  }

  export const listen = makeListenFn<Scene, EventType>();
  export const dispatch = makeDispatchFn<Scene, EventType>();

  export function append(parent: HTMLElement, scene: Scene) {
    parent.appendChild(scene.container);
    Scene.dispatch(scene, `resize`);
  }

  export function addPlot(scene: Scene, plot: Plot) {
    const { container, marker, plots } = scene;
    plots.push(plot);
    Plot.append(container, plot);

    Plot.listen(plot, `activate`, () => {
      for (const p of plots) if (p != plot) Plot.dispatch(p, `deactivate`);
    });

    Plot.listen(plot, `selected`, (e) => {
      Marker.update(marker, e.detail.selected);
    });

    Plot.listen(plot, `clicked-active`, () => {
      Marker.clearTransient(marker);
    });

    Marker.listen(marker, `changed`, () => {
      Plot.dispatch(plot, `render`);
    });

    const nCols = Math.ceil(Math.sqrt(plots.length));
    const nRows = Math.ceil(plots.length / nCols);
    Scene.setDimensions(scene, nRows, nCols);
  }

  export function addplotByType<T extends Dataframe>(
    scene: Scene<T>,
    type: Plots.Type,
    selectfn: (data: T) => any[][]
  ) {}

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

  container.addEventListener(`dblclick`, () => {
    for (const plot of plots) Plot.dispatch(plot, `deactivate`);
    Marker.clearAll(scene.marker);
  });

  Scene.listen(scene, `resize`, () => {
    for (const plot of plots) Plot.dispatch(plot, `resize`);
  });
}

const keydownHandlers: Record<string, (scene: Scene) => void> = {
  KeyR(scene: Scene) {},
};
