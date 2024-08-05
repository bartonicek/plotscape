import { ExpanseContinuous, Scale } from "../main";
import { Frame } from "../plot/Frame";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Name } from "../utils/Name";
import { LAYER, POSITIONS } from "../utils/symbols";
import { DataLayer, DataLayers, Indexable, Point, Rect } from "../utils/types";
import { FlatData, Geom, GroupedData } from "./Geom";

type Data = {
  x: Indexable;
  y: Indexable;
  area?: Indexable<number>;
};

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
  area: Scale<any, ExpanseContinuous>;
};

export interface Points extends Geom {
  type: Geom.Type.Points;
  data: { flat: Data & FlatData; grouped: Data & GroupedData };
  scales: Scales;
}

export namespace Points {
  export function of(data: { flat: Data; grouped: Data }): Points {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot

    const typedData = data as {
      flat: Data & FlatData;
      grouped: Data & GroupedData;
    };

    return { type: Geom.Type.Points, data: typedData, scales };
  }

  export function render(points: Points, layers: DataLayers) {
    const { scales } = points;
    const data = points.data.grouped;

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `area`, LAYER] as const;
    const [x, y, radius, layer] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      const ri = Scale.pushforward(scales.area, radius(i));
      const li = layers[layer(i) as DataLayer];

      Frame.point(li, xi, yi, { radius: ri });
    }
  }

  export function check(points: Points, selection: Rect) {
    const { scales } = points;
    const data = points.data.flat;

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `area`, POSITIONS] as const;
    const [x, y, radius, positions] = Geom.getters(data, vars);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      let ri = Scale.pushforward(scales.area, radius(i));
      ri = ri / Math.sqrt(2);

      const coords = [xi - ri, yi - ri, xi + ri, yi + ri] as Rect;

      if (rectsIntersect(selection, coords)) {
        const pos = positions(i);
        for (let j = 0; j < pos.length; j++) selected.push(pos[j]);
      }
    }

    return selected;
  }

  export function query(points: Points, position: Point) {
    const { scales } = points;
    const data = points.data.flat;

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `area`] as const;
    const [x, y, radius] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      let ri = Scale.pushforward(scales.area, radius(i));
      ri = ri / Math.sqrt(2);

      const coords = [xi - ri, yi - ri, xi + ri, yi + ri] as Rect;

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
