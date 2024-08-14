import { Frame } from "../plot/Frame";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { POSITIONS } from "../utils/symbols";
import { DataLayer, DataLayers, Indexable, Point, Rect } from "../utils/types";
import { FactorData, Geom } from "./Geom";

type Data = {
  x0: Indexable;
  y0: Indexable;
  x1: Indexable;
  y1: Indexable;
};

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
};

export interface Rectangles extends Geom {
  type: Geom.Type.Rectangles;
  data: (Data & FactorData)[];
  scales: Scales;
}

export namespace Rectangles {
  export function of(): Rectangles {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    const data = [] as (Data & FactorData)[];
    const type = Geom.Type.Rectangles;

    return { type, data, scales };
  }

  export function render(rectangles: Rectangles, layers: DataLayers) {
    const { scales } = rectangles;
    const data = Geom.groupedData(rectangles);

    const n = findLength(Object.values(data));
    const vars = [`x0`, `y0`, `x1`, `y1`, LAYER] as const;
    const [x0, y0, x1, y1, layer] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const x0i = Scale.pushforward(scales.x, x0(i));
      const y0i = Scale.pushforward(scales.y, y0(i));
      const x1i = Scale.pushforward(scales.x, x1(i));
      const y1i = Scale.pushforward(scales.y, y1(i));
      const li = layers[layer(i) as DataLayer];

      Frame.rectangleXY(li, x0i, y0i, x1i, y1i);
    }
  }

  export function check(rectangles: Rectangles, selection: Rect) {
    const { scales } = rectangles;
    const data = Geom.flatData(rectangles);

    const n = findLength(Object.values(data));
    const vars = [`x0`, `y0`, `x1`, `y1`, POSITIONS] as const;
    const [x0, y0, x1, y1, positions] = Geom.getters(data, vars);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      const x0i = Scale.pushforward(scales.x, x0(i));
      const y0i = Scale.pushforward(scales.y, y0(i));
      const x1i = Scale.pushforward(scales.x, x1(i));
      const y1i = Scale.pushforward(scales.y, y1(i));

      if (rectsIntersect(selection, [x0i, y0i, x1i, y1i])) {
        const pos = positions(i);
        for (let j = 0; j < pos.length; j++) selected.push(pos[j]);
      }
    }

    return selected;
  }

  export function query(rectangles: Rectangles, position: Point) {
    const { scales } = rectangles;
    const data = Geom.flatData(rectangles);

    const n = findLength(Object.values(data));
    const vars = [`x0`, `y0`, `x1`, `y1`] as const;
    const [x0, y0, x1, y1] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const x0i = Scale.pushforward(scales.x, x0(i));
      const y0i = Scale.pushforward(scales.y, y0(i));
      const x1i = Scale.pushforward(scales.x, x1(i));
      const y1i = Scale.pushforward(scales.y, y1(i));

      if (pointInRect(position, [x0i, y0i, x1i, y1i])) {
        const result = {} as Record<string, any>;

        for (const v of Object.values(data)) {
          if (v && Meta.hasName(v)) result[Meta.getName(v)] = Geom.getter(v)(i);
        }

        return result;
      }
    }
  }
}
