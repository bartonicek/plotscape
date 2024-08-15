import { Frame } from "../plot/Frame";
import { Plot } from "../plot/Plot";
import { addIndexed } from "../utils/funs";
import React from "../utils/JSX";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";
import { Group, Marker, Transient } from "./Marker";
import { WebSocketClient } from "./WebsocketClient";

export interface Scene<T extends Columns = Columns> extends Reactive {
  data: T;
  container: HTMLDivElement;
  client?: WebSocketClient;

  rows: number;
  cols: number;

  marker: Marker;
  plots: Plot[];
  targets: Record<string, Scene | Plot>;
}

export namespace Scene {
  export function of<T extends Columns>(
    data: T,
    options?: {
      websocketURL?: string;
    },
  ): Scene<T> {
    const container = (
      <div class="relate grid h-full w-full grid-cols-1 grid-rows-1 gap-5 bg-[#deded9] p-5 px-10"></div>
    ) as HTMLDivElement;

    const plots = [] as Plot[];
    const [rows, cols] = [1, 1];
    const marker = Marker.of(Object.values(data)[0].length);
    const targets = {} as Record<string, Scene | Plot>;

    for (const [k, v] of Object.entries(data)) {
      if (!Meta.hasName(v)) Meta.setName(v, k);
    }

    const scene = Reactive.of({
      data,
      container,
      rows,
      cols,
      marker,
      plots,
      targets,
    }) as Scene<T>;

    targets.scene = scene;

    if (options?.websocketURL) {
      scene.client = WebSocketClient.of(options.websocketURL, targets);
    }

    setupEvents(scene);

    return scene;
  }

  export type RespondsTo = `resize` | `connected` | `set-dims` | `add-plot`;
  export type RespondsWith = ``;

  export const listen = Reactive.makeListenFn<Scene, RespondsTo>();
  export const dispatch = Reactive.makeDispatchFn<Scene, RespondsWith>();

  export function append(parent: HTMLElement, scene: Scene) {
    parent.appendChild(scene.container);
    Scene.resize(scene);
  }

  export function addPlot(scene: Scene, plot: Plot) {
    const { container, marker, plots, targets } = scene;

    Plot.listen(plot, `activated`, () => {
      for (const p of plots) if (p != plot) Plot.dispatch(p, `deactivate`);
    });

    Plot.listen(plot, `selected`, (data) => {
      Marker.update(marker, data.selected);
    });

    Plot.listen(plot, `clear-transient`, () => {
      for (const p of plots) Frame.clear(p.frames.user);
      Marker.clearTransient(marker);
    });

    Plot.listen(plot, `lock-others`, () => {
      for (const p of plots) if (p !== plot) Plot.dispatch(p, `lock`);
    });

    plots.push(plot);

    // Add plot to targets under various pointer names
    const { type } = plot;
    targets[`plot${plots.length}`] = plot;
    if (type != `unknown`) {
      addIndexed(targets, type, plot);
      if (type.startsWith(`histo`)) addIndexed(targets, type + `gram`, plot);
      else addIndexed(targets, type + `plot`, plot);
    }

    Plot.append(container, plot);

    const nCols = Math.ceil(Math.sqrt(plots.length));
    const nRows = Math.ceil(plots.length / nCols);
    Scene.setDimensions(scene, nRows, nCols);
  }

  export function addPlotByType<T extends Columns>(
    scene: Scene<T>,
    type: Plot.Type,
    selectfn: (data: T) => any[][],
    options?: any,
  ) {
    if (type === `unknown`) return;
    const plot = Plot[type](scene, selectfn as any, options);
    Scene.addPlot(scene, plot);
  }

  export function setDimensions(scene: Scene, rows: number, cols: number) {
    const { container } = scene;
    scene.rows = rows;
    scene.cols = cols;
    container.style.gridTemplateRows = Array(rows).fill(`1fr`).join(` `);
    container.style.gridTemplateColumns = Array(cols).fill(`1fr`).join(` `);
    Scene.resize(scene);
  }

  export function resize(scene: Scene) {
    for (const plot of scene.plots) Plot.dispatch(plot, `resize`);
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

  window.addEventListener(`keydown`, (e) => keydownHandlers[e.code]?.(scene));
  window.addEventListener(`keyup`, () => Marker.setGroup(marker, Transient));

  Scene.listen(scene, `resize`, () => Scene.resize(scene));

  Marker.listen(marker, `cleared`, () => {
    for (const plot of plots) Plot.dispatch(plot, `unlock`);
  });

  // WebSocket Events

  Scene.listen(scene, `connected`, () =>
    console.log(`Connected to Websocket server on: ${scene.client!.url}`),
  );

  Scene.listen(scene, `set-dims`, (data) => {
    Scene.setDimensions(scene, data.rows, data.cols);
  });

  Scene.listen(scene, `add-plot`, (data) => {
    const { type, variables, options } = data;
    const selectfn = (data: Columns) => variables.map((x: string) => data[x]);
    Scene.addPlotByType(scene, type, selectfn);
  });
}

const keydownHandlers: Record<string, (scene: Scene) => void> = {
  Digit1: (scene) => Marker.setGroup(scene.marker, Group.First),
  Digit2: (scene) => Marker.setGroup(scene.marker, Group.Second),
  Digit3: (scene) => Marker.setGroup(scene.marker, Group.Third),
};
