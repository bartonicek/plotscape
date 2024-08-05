import { Frame, React } from "../main";
import { Plot } from "../plot/Plot";
import { addIndexed, makeDispatchFn, makeListenFn } from "../utils/funs";
import { Name } from "../utils/Name";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";
import { Group, Marker, Transient } from "./Marker";

export interface Scene<T extends Columns = Columns> extends Reactive {
  data: T;
  container: HTMLDivElement;

  rows: number;
  cols: number;

  marker: Marker;
  plots: Plot[];
  plotDict: Record<string, Plot>;
}

type EventType = `resize`;

export namespace Scene {
  export function of<T extends Columns>(data: T): Scene<T> {
    const container = (
      <div class="relate grid h-full w-full grid-cols-1 grid-rows-1 gap-5 bg-[#deded9] p-5"></div>
    ) as HTMLDivElement;

    const plots = [] as Plot[];
    const plotDict = {} as Record<string, Plot>;
    const marker = Marker.of(Object.values(data)[0].length);
    const dispatch = new EventTarget();
    const [rows, cols] = [1, 1];

    for (const [k, v] of Object.entries(data)) {
      if (!Name.has(v)) Name.set(v, k);
    }

    const scene = Reactive.of({
      data,
      container,
      rows,
      cols,
      dispatch,
      marker,
      plots,
      plotDict,
    });

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
    const { container, marker, plots, plotDict } = scene;

    Plot.listen(plot, `activate`, () => {
      for (const p of plots) if (p != plot) Plot.dispatch(p, `deactivate`);
    });

    Plot.listen(plot, `selected`, (e) => {
      Marker.update(marker, e.detail.selected);
    });

    Plot.listen(plot, `clear-transient`, () => {
      for (const p of plots) Frame.clear(p.frames.user);
      Marker.clearTransient(marker);
    });

    Plot.listen(plot, `lock-others`, () => {
      for (const p of plots) if (p !== plot) Plot.dispatch(p, `lock`);
    });

    plots.push(plot);
    plotDict[`plot${plots.length}`] = plot;
    if (plot.type != Plot.Type.Unknown) {
      addIndexed(plotDict, plot.type, plot);
    }

    Plot.append(container, plot);

    const nCols = Math.ceil(Math.sqrt(plots.length));
    const nRows = Math.ceil(plots.length / nCols);
    Scene.setDimensions(scene, nRows, nCols);
  }

  export function addplotByType<T extends Columns>(
    scene: Scene<T>,
    type: Plot.Type,
    selectfn: (data: T) => any[][],
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
  const { marker, plots, container } = scene;

  container.addEventListener(`mousedown`, () => {
    for (const plot of plots) Plot.dispatch(plot, `deactivate`);
  });

  container.addEventListener(`dblclick`, () => {
    for (const plot of plots) {
      Plot.dispatch(plot, `deactivate`);
      Frame.clear(plot.frames.user);
    }
    Marker.clearAll(scene.marker);
  });

  window.addEventListener(`keydown`, (e) => {
    keydownHandlers[e.code]?.(scene);
  });

  window.addEventListener(`keyup`, () => {
    Marker.setGroup(marker, Transient);
  });

  Scene.listen(scene, `resize`, () => {
    for (const plot of plots) Plot.dispatch(plot, `resize`);
  });

  Marker.listen(marker, `updated`, () => {
    for (const plot of plots) Plot.dispatch(plot, `render`);
  });

  Marker.listen(marker, `cleared`, () => {
    for (const plot of plots) {
      Plot.dispatch(plot, `render`);
      Plot.dispatch(plot, `unlock`);
    }
  });
}

const keydownHandlers: Record<string, (scene: Scene) => void> = {
  Digit1: (scene) => Marker.setGroup(scene.marker, Group.First),
  Digit2: (scene) => Marker.setGroup(scene.marker, Group.Second),
  Digit3: (scene) => Marker.setGroup(scene.marker, Group.Third),
};
