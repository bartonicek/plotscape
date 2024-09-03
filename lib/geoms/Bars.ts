import { Frame } from "../plot/Frame";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { POSITIONS } from "../transformation/Factor";
import {
  findLength,
  identity,
  pointInRect,
  rectsIntersect,
} from "../utils/funs";
import { Meta } from "../utils/Meta";
import {
  DataLayer,
  DataLayers,
  HAnchor,
  Indexable,
  Point,
  Rect,
  VAnchor,
} from "../utils/types";
import { FactorData, Geom } from "./Geom";

type Data = {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
};

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
  width: Scale<any, ExpanseContinuous>;
  height: Scale<any, ExpanseContinuous>;
};

export interface Bars extends Geom {
  type: Geom.Type.Bars;
  data: (Data & FactorData)[];
  scales: Scales;

  postfn: (
    coords: [x: number, y: number, width: number, height: number],
  ) => void;
  vAnchor: VAnchor;
  hAnchor: HAnchor;
}

export namespace Bars {
  export function of(options?: {
    postfn?: (
      coords: [x: number, y: number, width: number, height: number],
    ) => void;
    vAnchor?: VAnchor;
    hAnchor?: HAnchor;
  }): Bars {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    const data = [] as (Data & FactorData)[];

    const type = Geom.Type.Bars;
    const vAnchor = options?.vAnchor ?? VAnchor.Bottom;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;
    const postfn = options?.postfn ?? identity;

    return { type, data, scales, postfn, vAnchor, hAnchor };
  }

  export function render(bars: Bars, layers: DataLayers) {
    const { scales, postfn, hAnchor, vAnchor } = bars;
    const data = Geom.groupedData(bars);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `width`, `height`, LAYER] as const;
    const [x, y, width, height, layer] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      let xi = Scale.pushforward(scales.x, x(i));
      let yi = Scale.pushforward(scales.y, y(i));
      let wi = Scale.pushforward(scales.width, width(i));
      let hi = Scale.pushforward(scales.height, height(i));
      const li = layers[layer(i) as DataLayer];

      const coords = [xi, yi, wi, hi] as Rect;
      postfn(coords);

      Frame.rectangleWH(li, ...coords, { hAnchor, vAnchor });
    }
  }

  export function check(bars: Bars, selection: Rect) {
    const { scales, postfn, hAnchor, vAnchor } = bars;
    const data = Geom.flatData(bars);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `width`, `height`, POSITIONS] as const;
    const [x, y, width, height, positions] = Geom.getters(data, vars);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      let xi = Scale.pushforward(scales.x, x(i));
      let yi = Scale.pushforward(scales.y, y(i));
      let wi = Scale.pushforward(scales.width, width(i));
      let hi = Scale.pushforward(scales.height, height(i));

      const coords = [xi, yi, wi, hi] as Rect;
      postfn(coords);

      [xi, yi, wi, hi] = coords;

      const rectCoords = [
        xi - wi * hAnchor,
        yi - hi * vAnchor,
        xi + wi * hAnchor,
        yi + hi * (1 - vAnchor),
      ] as Rect;

      if (rectsIntersect(selection, rectCoords)) {
        const pos = positions(i);
        for (let j = 0; j < pos.length; j++) selected.push(pos[j]);
      }
    }

    return selected;
  }

  export function query(bars: Bars, position: Point) {
    const { scales, postfn, hAnchor, vAnchor } = bars;
    const data = Geom.flatData(bars);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `width`, `height`] as const;
    const [x, y, width, height] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      let xi = Scale.pushforward(scales.x, x(i));
      let yi = Scale.pushforward(scales.y, y(i));
      let wi = Scale.pushforward(scales.width, width(i));
      let hi = Scale.pushforward(scales.height, height(i));

      const coords = [xi, yi, wi, hi] as Rect;
      postfn(coords);

      [xi, yi, wi, hi] = coords;

      const rectCoords = [
        xi - wi * hAnchor,
        yi - hi * vAnchor,
        xi + wi * hAnchor,
        yi + hi * (1 - vAnchor),
      ] as Rect;

      if (pointInRect(position, rectCoords)) {
        const result = {} as Record<string, any>;

        if (Meta.has(data.x, `name`)) result[Meta.get(data.x, `name`)] = x(i);
        if (Meta.has(data.y, `name`)) result[Meta.get(data.y, `name`)] = y(i);
        if (Meta.has(data.height, `name`)) {
          result[Meta.get(data.height, `name`)] = height(i);
        }

        for (const [k, v] of Object.entries(data)) {
          if ([`x`, `y`, `width`, `height`].includes(k)) continue;
          if (v && Meta.has(v, `name`)) {
            result[Meta.get(v, `name`)] = Geom.getter(v)(i);
          }
        }

        return result;
      }
    }
  }
}
