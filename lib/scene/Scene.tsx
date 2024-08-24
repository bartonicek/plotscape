import { Reducer } from "../main";
import { Frame } from "../plot/Frame";
import { Plot } from "../plot/Plot";
import {
  fetchJSON,
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
import { defaultOptions, Options, updateOptions } from "./defaultOptions";
import { keybindingsMenu } from "./Keybindings";
import { Group, Marker, Transient } from "./Marker";

export interface Scene<T extends Columns = Columns> extends Reactive {
  data: T;
  container: HTMLDivElement;
  plotContainer: HTMLDivElement;
  client?: WebSocket;

  rows: number;
  cols: number;

  marker: Marker;

  activePlot?: Plot;
  plots: Plot[];
  plotsByType: Record<Plot.Type, Plot[]>;

  keybindings: Record<string, Scene.Event | Plot.Event>;
  options: Options;
}

export namespace Scene {
  export function of<T extends Columns>(
    data: T,
    options?: {
      websocketURL?: string;
    } & Partial<Options>,
  ): Scene<T> {
    const container = (
      <div
        id="scene-container"
        class="pr-15 relative flex h-full w-full content-center items-center justify-center bg-[#deded9] p-10"
      >
        <div
          id="plot-container"
          class="grid h-full w-full grid-cols-1 grid-rows-1 gap-5"
        ></div>
      </div>
    ) as HTMLDivElement;

    const pc = container.querySelector<HTMLDivElement>("#plot-container")!;

    const [rows, cols] = [1, 1];
    const marker = Marker.of(Object.values(data)[0].length);
    const plots = [] as Plot[];
    const plotsByType = {} as Record<Plot.Type, Plot[]>;

    const opts = Object.assign(defaultOptions, options);
    updateOptions(opts);

    for (const [k, v] of Object.entries(data)) {
      if (!Meta.hasName(v)) Meta.setName(v, k);
    }

    const keybindings = { ...Scene.keybindings, ...Plot.keybindings };

    // Mock interface for just echoing messages back
    const client = { send: console.log } as WebSocket;

    const scene: Scene<T> = Reactive.of({
      data,
      container,
      plotContainer: pc,
      rows,
      cols,
      marker,
      client,
      plots,
      plotsByType,
      options: opts,
      keybindings,
    });

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

    container.appendChild(keybindingsMenu(scene));

    setupEvents(scene);
    return scene;
  }

  export async function ofAsync(
    url: string,
    options?: {
      websocketURL?: string;
    } & Partial<Options>,
  ) {
    const data = await fetchJSON(url);
    return Scene.of(data, options);
  }

  export type Event =
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
    | `zoom`
    | `query-mode`
    | `group-1`
    | `group-2`
    | `group-3`
    | (string & {});

  export const listen = Reactive.makeListenFn<Scene, Event>();
  export const dispatch = Reactive.makeDispatchFn<Scene, Event>();

  export function append(parent: HTMLElement, scene: Scene) {
    parent.appendChild(scene.container);
    Scene.resize(scene);
  }

  export function addPlot(scene: Scene, plot: Plot) {
    const { plotContainer, marker, plots, plotsByType } = scene;

    Plot.listen(plot, `activated`, () => {
      for (const p of plots) if (p != plot) Plot.dispatch(p, `deactivate`);
      scene.activePlot = plot;
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

  export function addPlotBySpec<T extends Columns>(
    scene: Scene<T>,
    spec?: {
      type?: Plot.Type;
      variables?: (keyof T)[];
      ratio?: number;
      reducer?: Reducer.Name | Reducer | Reducer.Stringified;
      queries?: string[] | [string, Reducer.Name | Reducer][];
    },
  ) {
    const { type, variables, reducer: r, queries: q } = spec ?? {};
    if (!type || type === `unknown` || !variables) return;

    for (const v of variables as string[]) {
      if (!Object.keys(scene.data).includes(v)) {
        throw new Error(`Variable '${v}' is not present in the data`);
      }
    }

    const selectfn = keysToSelectors(variables as string[]);

    const opts = {} as any;

    if (r) opts.reducer = Reducer.parse(r);
    if (q) {
      if (isStringArray(q)) opts.queries = keysToSelectors(q);
      else {
        const queryfn = (data: any) => {
          return q.map(([s, r]) => [data[s], Reducer.parse(r)]);
        };
        opts.queries = queryfn;
      }
    }

    const plot = Plot[type](scene, selectfn as any, opts);
    Scene.addPlot(scene, plot);
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
    type: Event,
    data: Record<string, any>,
  ) {
    const [sender, target] = [`scene`, `session`];
    const message = JSON.stringify({ sender, target, type, data });
    scene.client!.send(message);
  }

  export function resize(scene: Scene) {
    for (const plot of scene.plots) Plot.dispatch(plot, `resize`);
  }

  export function reset(scene: Scene) {
    for (const plot of scene.plots) Plot.dispatch(plot, `reset`);
    Marker.clearTransient(scene.marker);
  }

  export function setQueryMode(scene: Scene) {
    for (const plot of scene.plots) Plot.dispatch(plot, `query-mode`);
  }

  export function setGroupFirst(scene: Scene) {
    Marker.setGroup(scene.marker, Group.First);
  }

  export function setGroupSecond(scene: Scene) {
    Marker.setGroup(scene.marker, Group.Second);
  }

  export function setGroupThird(scene: Scene) {
    Marker.setGroup(scene.marker, Group.Third);
  }

  export function setKeyBinding(
    scene: Scene,
    key: string,
    event: Scene.Event | Plot.Event,
  ) {
    let oldkey: string | undefined = undefined;

    for (const [k, v] of Object.entries(scene.keybindings)) {
      if (v === event) {
        oldkey = k;
        break;
      }
    }

    if (oldkey) delete scene.keybindings[oldkey];
    scene.keybindings[key] = event;
  }

  export const keybindings: Record<string, Event> = {
    r: `reset`,
    q: `query-mode`,
    1: `group-1`,
    2: `group-2`,
    3: `group-3`,
  };
}

function setupEvents(scene: Scene) {
  const { marker, plots, plotContainer, keybindings } = scene;

  plotContainer.addEventListener(`mousedown`, () => {
    for (const plot of plots) Plot.dispatch(plot, `deactivate`);
  });

  plotContainer.addEventListener(`dblclick`, () => {
    for (const plot of plots) {
      Plot.dispatch(plot, `deactivate`);
      Frame.clear(plot.frames.user);
    }
    Marker.clearAll(scene.marker);
    scene.activePlot = undefined;
  });

  window.addEventListener(`keydown`, (e) => {
    const event = keybindings[e.key];

    if (event) {
      if (scene.activePlot) Plot.dispatch(scene.activePlot, event);
      Scene.dispatch(scene, event);
    }
  });

  window.addEventListener(`keyup`, () => {
    Marker.setGroup(marker, Transient);
    for (const p of scene.plots) {
      p.parameters.mode = Plot.Mode.Select;
      p.queryTable.style.display = `none`;
    }
  });

  window.addEventListener(`resize`, () => Scene.resize(scene));

  Marker.listen(marker, `cleared`, () => {
    for (const plot of plots) Plot.dispatch(plot, `unlock`);
  });

  Scene.listen(scene, `resize`, () => Scene.resize(scene));
  Scene.listen(scene, `reset`, () => Scene.reset(scene));
  Scene.listen(scene, `query-mode`, () => Scene.setQueryMode(scene));
  Scene.listen(scene, `group-1`, () => Scene.setGroupFirst(scene));
  Scene.listen(scene, `group-2`, () => Scene.setGroupSecond(scene));
  Scene.listen(scene, `group-3`, () => Scene.setGroupThird(scene));

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
    if (!data || !data.id) return;
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Plot.dispatch(plot, `set-scale`, data);
  });

  Scene.listen(scene, `zoom`, (data) => {
    if (!data || !data.id) return;
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Plot.dispatch(plot, `zoom`, data);
  });
}

const plotIdShortDict = {
  s: `scatter`,
  b: `bar`,
  h: `histo`,
  f: `fluct`,
  hh: `histo2d`,
  pc: `pcoords`,
};
