import { Frame } from "../plot/Frame";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { POSITIONS } from "../transformation/Factor";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Meta } from "../utils/Meta";
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
  area: Scale<any, ExpanseContinuous>;
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
    const vars = [`x0`, `y0`, `x1`, `y1`, `area`, LAYER] as const;
    const [x0, y0, x1, y1, area, layer] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      let x0i = Scale.pushforward(scales.x, x0(i));
      let y0i = Scale.pushforward(scales.y, y0(i));
      let x1i = Scale.pushforward(scales.x, x1(i));
      let y1i = Scale.pushforward(scales.y, y1(i));
      const li = layers[layer(i) as DataLayer];

      if (data.area) {
        const ai = Scale.pushforward(scales.area, area(i));
        const rxi = x1i - x0i;
        const ryi = y1i - y0i;

        x0i = x0i + ((1 - ai) / 2) * rxi;
        x1i = x1i - ((1 - ai) / 2) * rxi;
        y0i = y0i + ((1 - ai) / 2) * ryi;
        y1i = y1i - ((1 - ai) / 2) * ryi;
      }

      Frame.rectangleXY(li, x0i, y0i, x1i, y1i);
    }
  }

  export function check(rectangles: Rectangles, selection: Rect) {
    const { scales } = rectangles;
    const data = Geom.flatData(rectangles);

    const n = findLength(Object.values(data));
    const vars = [`x0`, `y0`, `x1`, `y1`, `area`, POSITIONS] as const;
    const [x0, y0, x1, y1, area, positions] = Geom.getters(data, vars);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      let x0i = Scale.pushforward(scales.x, x0(i));
      let y0i = Scale.pushforward(scales.y, y0(i));
      let x1i = Scale.pushforward(scales.x, x1(i));
      let y1i = Scale.pushforward(scales.y, y1(i));

      if (data.area) {
        const ai = Scale.pushforward(scales.area, area(i));
        const rxi = x1i - x0i;
        const ryi = y1i - y0i;

        x0i = x0i + ((1 - ai) / 2) * rxi;
        x1i = x1i - ((1 - ai) / 2) * rxi;
        y0i = y0i + ((1 - ai) / 2) * ryi;
        y1i = y1i - ((1 - ai) / 2) * ryi;
      }

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
    const vars = [`x0`, `y0`, `x1`, `y1`, `area`] as const;
    const [x0, y0, x1, y1, area] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      let x0i = Scale.pushforward(scales.x, x0(i));
      let y0i = Scale.pushforward(scales.y, y0(i));
      let x1i = Scale.pushforward(scales.x, x1(i));
      let y1i = Scale.pushforward(scales.y, y1(i));

      if (data.area) {
        const ai = Scale.pushforward(scales.area, area(i));
        const rxi = x1i - x0i;
        const ryi = y1i - y0i;

        x0i = x0i + ((1 - ai) / 2) * rxi;
        x1i = x1i - ((1 - ai) / 2) * rxi;
        y0i = y0i + ((1 - ai) / 2) * ryi;
        y1i = y1i - ((1 - ai) / 2) * ryi;
      }

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
