import { ExpanseContinuous, Scale } from "../main";
import { Frame } from "../plot/Frame";
import { LAYER } from "../scene/Marker";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { POSITIONS } from "../utils/symbols";
import { DataLayer, DataLayers, Indexable, Point, Rect } from "../utils/types";
import { FactorData, Geom } from "./Geom";

type Data = {
  x: Indexable;
  y: Indexable;
  size?: Indexable<number>;
};

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
  size: Scale<any, ExpanseContinuous>;
};

export interface Points extends Geom {
  type: Geom.Type.Points;
  data: (Data & FactorData)[];
  scales: Scales;
}

export namespace Points {
  export function of(): Points {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    const data = [] as (Data & FactorData)[];
    return { type: Geom.Type.Points, data, scales };
  }

  export function render(points: Points, layers: DataLayers) {
    const { scales } = points;
    const data = Geom.groupedData(points);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `size`, LAYER] as const;
    const [x, y, radius, layer] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      const ri = Scale.pushforward(scales.size, radius(i));
      const li = layers[layer(i) as DataLayer];

      Frame.point(li, xi, yi, { radius: ri });
    }
  }

  export function check(points: Points, selection: Rect) {
    const { scales } = points;
    const data = Geom.flatData(points);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `size`, POSITIONS] as const;
    const [x, y, radius, positions] = Geom.getters(data, vars);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      let ri = Scale.pushforward(scales.size, radius(i));
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
    const data = Geom.flatData(points);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, `size`] as const;
    const [x, y, radius] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      let ri = Scale.pushforward(scales.size, radius(i));
      ri = ri / Math.sqrt(2);

      const coords = [xi - ri, yi - ri, xi + ri, yi + ri] as Rect;

      if (pointInRect(position, coords)) {
        const result = {} as Record<string, any>;

        for (const v of Object.values(data)) {
          if (v && Meta.hasName(v)) result[Meta.getName(v)] = Geom.getter(v)(i);
        }

        return result;
      }
    }
  }
}
