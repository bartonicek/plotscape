import { Reducer } from "../main";
import { Frame } from "../plot/Frame";
import { Plot } from "../plot/Plot";
import {
  filterIndices,
  isStringArray,
  keysToSelectors,
  last,
  remove,
  splitNumericSuffix,
} from "../utils/funs";
import React from "../utils/JSX";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";
import { keyBindings } from "./Keybindings";
import { Group, Marker, Transient } from "./Marker";

export interface Scene<T extends Columns = Columns> extends Reactive {
  data: T;
  container: HTMLDivElement;
  plotContainer: HTMLDivElement;
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
      <div
        id="scene"
        class="pr-15 relative flex h-full w-full content-center items-center justify-center bg-[#deded9] p-10"
      >
        <div
          id="plot-container"
          class="grid h-full w-full grid-cols-1 grid-rows-1 gap-5"
        ></div>
        {keyBindings()}
      </div>
    );

    const pc = container.querySelector<HTMLDivElement>("#plot-container")!;

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
      plotContainer: pc,
      rows,
      cols,
      marker,
      client,
      plots,
      plotsByType,
    }) as Scene<T>;

    if (options?.websocketURL) {
      const client = new WebSocket(options.websocketURL);

      const msg = { sender: `scene`, target: `session`, type: `connected` };
      client.addEventListener(`open`, () => client.send(JSON.stringify(msg)));
      client.addEventListener(`message`, (msg) => {
        handleMessage(scene, JSON.parse(msg.data));
      });

      window.addEventListener(`beforeunload`, () => client.close());
      scene.client = client;
    }

    setupEvents(scene);
    return scene;
  }

  export type EventType =
    | `reset`
    | `resize`
    | `connected`
    | `set-dims`
    | `add-plot`
    | `pop-plot`
    | `remove-plot`
    | `set-selected`
    | `set-assigned`
    | `get-selected`
    | `get-assigned`
    | `clear-selection`
    | `set-scale`
    | `zoom`;

  export const listen = Reactive.makeListenFn<Scene, EventType>();
  export const dispatch = Reactive.makeDispatchFn<Scene, EventType>();

  export function append(parent: HTMLElement, scene: Scene) {
    parent.appendChild(scene.container);
    Scene.resize(scene);
  }

  export function addPlot(scene: Scene, plot: Plot) {
    const { plotContainer, marker, plots, plotsByType } = scene;

    Plot.listen(plot, `activated`, () => {
      for (const p of plots) if (p != plot) Plot.dispatch(p, `deactivate`);
    });

    Plot.listen(plot, `lock-others`, () => {
      for (const p of plots) if (p !== plot) Plot.dispatch(p, `lock`);
    });

    Plot.listen(plot, `set-selected`, (data) => {
      Marker.update(marker, data.cases);
    });

    Plot.listen(plot, `clear-transient`, () => {
      for (const p of plots) Plot.clearUserFrame(p);
      Marker.clearTransient(marker);
    });

    plots.push(plot);

    const { type } = plot;
    if (!plotsByType[type]) plotsByType[type] = [] as Plot[];
    plotsByType[type].push(plot);

    Plot.append(plotContainer, plot);

    updatePlotIds(scene);
    autoUpdateDimensions(scene);

    Scene.resize(scene);
  }

  function autoUpdateDimensions(scene: Scene) {
    const { plots } = scene;
    if (plots.length === 0) return;
    const cols = Math.ceil(Math.sqrt(plots.length));
    const rows = Math.ceil(plots.length / cols);
    Scene.setDimensions(scene, rows, cols);
  }

  function updatePlotIds(scene: Scene) {
    for (let i = 0; i < scene.plots.length; i++) {
      scene.plots[i].container.id = `plot${i + 1}`;
    }
  }

  export function addPlotBySpec<T extends Columns>(
    scene: Scene<T>,
    options?: {
      type?: Plot.Type;
      variables?: string[];
      ratio?: number;
      reducer?: Reducer.Name | Reducer;
      queries?: string[] | [string, Reducer.Name | Reducer][];
    },
  ) {
    const { type, variables, reducer: r, queries: q } = options ?? {};
    if (!type || type === `unknown` || !variables) return;

    for (const v of variables) {
      if (!Object.keys(scene.data).includes(v)) {
        throw new Error(`Variable '${v}' is not present in the data`);
      }
    }

    const selectfn = keysToSelectors(variables);
    const opts = options as any;

    if (r) opts.reducer = Reducer.get(r);
    if (q) {
      if (isStringArray(q)) opts.queries = keysToSelectors(q);
      else {
        const queryfn = (data: any) => {
          return q.map(([s, r]) => [data[s], Reducer.get(r)]);
        };
        opts.queries = queryfn;
      }
    }

    const plot = Plot[type](scene, selectfn as any, opts);
    Scene.addPlot(scene, plot);
  }

  export function popPlot(scene: Scene) {
    const plot = last(scene.plots);
    if (plot) removeSpecificPlot(scene, plot);
  }

  export function removePlot(scene: Scene, id: PlotId) {
    const plot = getPlot(scene, id);
    if (plot) removeSpecificPlot(scene, plot);
  }

  function removeSpecificPlot(scene: Scene, plot: Plot) {
    remove(scene.plots, plot);
    remove(scene.plotsByType[plot.type], plot);

    scene.plotContainer.removeChild(plot.container);
    Reactive.removeAllListeners(plot);

    updatePlotIds(scene);
    autoUpdateDimensions(scene);

    Scene.resize(scene);
  }

  export function setDimensions(scene: Scene, rows: number, cols: number) {
    const { plotContainer } = scene;
    scene.rows = rows;
    scene.cols = cols;
    plotContainer.style.gridTemplateRows = Array(rows).fill(`1fr`).join(` `);
    plotContainer.style.gridTemplateColumns = Array(cols).fill(`1fr`).join(` `);
    Scene.resize(scene);
  }

  export function resize(scene: Scene) {
    for (const plot of scene.plots) Plot.dispatch(plot, `resize`);
  }

  export function reset(scene: Scene) {
    for (const plot of scene.plots) Plot.dispatch(plot, `reset`);
  }

  export type TargetId = `session` | `scene` | PlotId;
  export type PlotId =
    | `plot${number}`
    | `${Plot.Type}${number}`
    | `${Plot.Type}plot${number}`
    | `${Plot.Type}gram${number}`;

  export interface Message {
    sender: `session` | `scene`;
    target: TargetId;
    type: string;
    data?: Record<string, any>;
  }

  export function getTarget(scene: Scene, id: TargetId) {
    if (id === `scene`) return scene;
    else return getPlot(scene, id as PlotId);
  }

  export function getPlot(scene: Scene, id: PlotId) {
    const { plots, plotsByType } = scene;
    let [type, idString] = splitNumericSuffix(id);
    const index = parseInt(idString, 10) - 1; // 0 based indexing;

    if (type === `plot` || type === `p`) return plots[index];

    // Remove to match e.g. 'barplot' or 'histogram' with 'bar' and 'histo'
    type = type.replace(`plot`, ``).replace(`gram`, ``);
    // Match short plot id
    if (type in Object.keys(plotIdShortDict)) {
      type = plotIdShortDict[type as keyof typeof plotIdShortDict];
    }

    if (type in plotsByType) return plotsByType[type as Plot.Type][index];
  }

  export function handleMessage(scene: Scene, message: Message) {
    const { client } = scene;

    if (!client) return;

    const { type, target, data } = message;
    const t = getTarget(scene, target);

    if (t) Reactive.dispatch(t, type, data);
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
  const { marker, plots, plotContainer } = scene;

  plotContainer.addEventListener(`mousedown`, () => {
    for (const plot of plots) Plot.dispatch(plot, `deactivate`);
  });

  plotContainer.addEventListener(`dblclick`, () => {
    for (const plot of plots) {
      Plot.dispatch(plot, `deactivate`);
      Frame.clear(plot.frames.user);
    }
    Marker.clearAll(scene.marker);
  });

  window.addEventListener(`keydown`, (e) => keydownHandlers[e.code]?.(scene));
  window.addEventListener(`keyup`, () => Marker.setGroup(marker, Transient));

  Marker.listen(marker, `cleared`, () => {
    for (const plot of plots) Plot.dispatch(plot, `unlock`);
  });

  Scene.listen(scene, `resize`, () => Scene.resize(scene));
  Scene.listen(scene, `reset`, () => Scene.reset(scene));

  Scene.listen(scene, `connected`, () =>
    console.log(`Connected to Websocket server on: ${scene.client?.url}`),
  );

  Scene.listen(scene, `set-dims`, (data) => {
    Scene.setDimensions(scene, data.rows, data.cols);
  });

  Scene.listen(scene, `add-plot`, (data) => Scene.addPlotBySpec(scene, data));
  Scene.listen(scene, `pop-plot`, () => Scene.popPlot(scene));
  Scene.listen(scene, `remove-plot`, (data) => {
    Scene.removePlot(scene, data.id);
  });

  Scene.listen(scene, `set-selected`, (data) =>
    Marker.update(marker, data.cases),
  );

  Scene.listen(scene, `set-assigned`, (data) => {
    const group = 7 - Math.min(data.group, 3);
    Marker.update(marker, data.cases, { group });
  });

  Scene.listen(scene, `get-selected`, () => {
    const cases = filterIndices(marker.indices, Marker.isTransient);
    Scene.sendMessage(scene, `get-selected`, { cases });
  });

  Scene.listen(scene, `get-assigned`, (data) => {
    const isGroup = (x: number) => (x | 4) === 7 - Math.min(data.group, 3);
    const cases = filterIndices(marker.indices, isGroup);
    Scene.sendMessage(scene, `get-assigned`, { cases, group: data.group });
  });

  Scene.listen(scene, `clear-selection`, () => Marker.clearAll(marker));

  Scene.listen(scene, `set-scale`, (data) => {
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Plot.dispatch(plot, `set-scale`, data);
  });

  Scene.listen(scene, `zoom`, (data) => {
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Plot.dispatch(plot, `zoom`, data);
  });
}

const keydownHandlers: Record<string, (scene: Scene) => void> = {
  Digit1: (scene) => Marker.setGroup(scene.marker, Group.First),
  Digit2: (scene) => Marker.setGroup(scene.marker, Group.Second),
  Digit3: (scene) => Marker.setGroup(scene.marker, Group.Third),
};

const plotIdShortDict = {
  s: `scatter`,
  b: `bar`,
  h: `histo`,
  f: `fluct`,
  hh: `histo2d`,
  pc: `pcoords`,
};
