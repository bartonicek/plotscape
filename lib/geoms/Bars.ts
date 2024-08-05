import { ExpanseContinuous, Frame, Scale } from "../main";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Name } from "../utils/Name";
import { LAYER, POSITIONS } from "../utils/symbols";
import {
  DataLayer,
  DataLayers,
  HAnchor,
  Indexable,
  Point,
  Rect,
  VAnchor,
} from "../utils/types";
import { FlatData, Geom, GroupedData } from "./Geom";

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
  data: { flat: Data & FlatData; grouped: Data & GroupedData };
  scales: Scales;

  vAnchor: VAnchor;
  hAnchor: HAnchor;
}

export namespace Bars {
  export function of(
    data: { flat: Data; grouped: Data },
    options?: {
      vAnchor?: VAnchor;
      hAnchor?: HAnchor;
    },
  ): Bars {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot

    const type = Geom.Type.Bars;
    const vAnchor = options?.vAnchor ?? VAnchor.Bottom;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;

    const typedData = data as {
      flat: Data & FlatData;
      grouped: Data & GroupedData;
    };

    return { type, data: typedData, scales, vAnchor, hAnchor };
  }

  export function render(bars: Bars, layers: DataLayers) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = bars.data.grouped;

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `width`, `height`, LAYER] as const;
    const [x, y, width, height, layer] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      const wi = Scale.pushforward(scales.width, width(i));
      const hi = Scale.pushforward(scales.height, height(i));
      const li = layers[layer(i) as DataLayer];

      Frame.rectangleWH(li, xi, yi, wi, hi, { hAnchor, vAnchor });
    }
  }

  export function check(bars: Bars, selection: Rect) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = bars.data.flat;

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `width`, `height`, POSITIONS] as const;
    const [x, y, width, height, positions] = Geom.getters(data, vars);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      const wi = Scale.pushforward(scales.width, width(i));
      const hi = Scale.pushforward(scales.height, height(i));

      const coords = [
        xi - wi * hAnchor,
        yi - hi * vAnchor,
        xi + wi * hAnchor,
        yi + hi * (1 - vAnchor),
      ] as Rect;

      if (rectsIntersect(selection, coords)) {
        const pos = positions(i);
        for (let j = 0; j < pos.length; j++) selected.push(pos[j]);
      }
    }

    return selected;
  }

  export function query(bars: Bars, position: Point) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = bars.data.flat;

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `width`, `height`] as const;
    const [x, y, width, height] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      const wi = Scale.pushforward(scales.width, width(i));
      const hi = Scale.pushforward(scales.height, height(i));

      const coords = [
        xi - wi * hAnchor,
        yi - hi * vAnchor,
        xi + wi * hAnchor,
        yi + hi * (1 - vAnchor),
      ] as Rect;

      if (pointInRect(position, coords)) {
        const result = {} as Record<string, any>;

        for (const v of Object.values(data)) {
          if (v && Name.has(v)) result[Name.get(v)] = Geom.getter(v)(i);
        }

        return result;
      }
    }
  }
}
