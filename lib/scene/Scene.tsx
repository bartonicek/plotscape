import { Frame } from "../plot/Frame";
import { Plot } from "../plot/Plot";
import {
  filterIndices,
  keysToSelector,
  splitNumericSuffix,
} from "../utils/funs";
import React from "../utils/JSX";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";
import { Group, Marker, Transient } from "./Marker";

export interface Scene<T extends Columns = Columns> extends Reactive {
  data: T;
  container: HTMLDivElement;
  client?: WebSocket;

  rows: number;
  cols: number;

  marker: Marker;
  plots: Plot[];
  plotsByType: Record<Plot.Type, Plot[]>;
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

    const [rows, cols] = [1, 1];
    const marker = Marker.of(Object.values(data)[0].length);
    const plots = [] as Plot[];
    const plotsByType = {} as Record<Plot.Type, Plot[]>;

    for (const [k, v] of Object.entries(data)) {
      if (!Meta.hasName(v)) Meta.setName(v, k);
    }

    // Mock interface for just echoing messages back
    const client = { send: console.log } as WebSocket;

    const scene = Reactive.of({
      data,
      container,
      rows,
      cols,
      marker,
      client,
      plots,
      plotsByType,
    }) as Scene<T>;

    if (options?.websocketURL) {
      scene.client = new WebSocket(options.websocketURL);
      scene.client.addEventListener(`message`, (msg) => {
        handleMessage(scene, JSON.parse(msg.data));
      });
    }

    setupEvents(scene);
    return scene;
  }

  export type EventType =
    | `resize`
    | `connected`
    | `set-dims`
    | `add-plot`
    | `select`
    | `assign`
    | `selected`
    | `assigned`;

  export const listen = Reactive.makeListenFn<Scene, EventType>();
  export const dispatch = Reactive.makeDispatchFn<Scene, EventType>();

  export function append(parent: HTMLElement, scene: Scene) {
    parent.appendChild(scene.container);
    Scene.resize(scene);
  }

  export function addPlot(scene: Scene, plot: Plot) {
    const { container, marker, plots, plotsByType } = scene;

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

    const { type } = plot;
    if (!plotsByType[type]) plotsByType[type] = [] as Plot[];
    plotsByType[type].push(plot);

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

  export type Target =
    | `session`
    | `scene`
    | `plot${number}`
    | `${Plot.Type}${number}`
    | `${Plot.Type}plot${number}`
    | `${Plot.Type}gram${number}`;

  export interface Message {
    sender: `session` | `scene`;
    target: Target;
    type: string;
    data?: Record<string, any>;
  }

  export function getTarget(scene: Scene, targetId: Target) {
    if (targetId === `scene`) return scene;

    const { plots, plotsByType } = scene;
    let [type, idString] = splitNumericSuffix(targetId);
    const id = parseInt(idString, 10) - 1; // 0 based indexing;

    if (type === `plot`) return plots[id];

    // Remove to match e.g. 'barplot' or 'histogram' with 'bar' and 'histo'
    type = type.replace(`plot`, ``).replace(`gram`, ``);

    if (type in plotsByType) return plotsByType[type as Plot.Type][id];
  }

  export function handleMessage(scene: Scene, message: Message) {
    const { client } = scene;

    if (!client) return;

    const { type, target: targetId, data } = message;
    const target = getTarget(scene, targetId);

    if (target) Reactive.dispatch(target, type, data);
  }

  export function sendMessage(
    scene: Scene,
    type: EventType,
    data: Record<string, any>,
  ) {
    const [sender, target] = [`scene`, `session`];
    const message = JSON.stringify({ sender, target, type, data });
    scene.client!.send(message);
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
    const selectfn = keysToSelector(variables);
    Scene.addPlotByType(scene, type, selectfn, options);
  });

  Scene.listen(scene, `select`, (data) => {
    Marker.update(marker, data.cases);
  });

  Scene.listen(scene, `assign`, (data) => {
    const group = 7 - Math.min(data.group, 3);
    Marker.update(marker, data.cases, { group });
  });

  Scene.listen(scene, `selected`, () => {
    const cases = filterIndices(marker.indices, Marker.isTransient);
    Scene.sendMessage(scene, `selected`, { cases });
  });

  Scene.listen(scene, `assigned`, (data) => {
    const isGroup = (x: number) => (x | 4) === 7 - Math.min(data.group, 3);
    const cases = filterIndices(marker.indices, isGroup);
    Scene.sendMessage(scene, `assigned`, { cases, group: data.group });
  });
}

const keydownHandlers: Record<string, (scene: Scene) => void> = {
  Digit1: (scene) => Marker.setGroup(scene.marker, Group.First),
  Digit2: (scene) => Marker.setGroup(scene.marker, Group.Second),
  Digit3: (scene) => Marker.setGroup(scene.marker, Group.Third),
};
