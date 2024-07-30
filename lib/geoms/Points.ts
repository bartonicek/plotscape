import { Frame } from "../Frame";
import { Geom, GeomType } from "./Geom";
import { ExpanseContinuous, Scale } from "../main";
import { LAYER, POSITIONS } from "../utils/symbols";
import { DataLayer, Indexable, Layers, Rect } from "../utils/types";
import { defaultParameters } from "../utils/defaultParameters";
import { Getter } from "../Getter";
import { makeGetter, rectsIntersect } from "../utils/funs";

type PointData = {
  x: number[];
  y: number[];
  area?: number[];
} & { [LAYER]: number[]; [POSITIONS]: Indexable<number[]> };

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
  area: Scale<any, ExpanseContinuous>;
};

export interface Points extends Geom {
  type: GeomType.Points;
  data: PointData;
  scales: Scales;
}

export namespace Points {
  export function of(data: PointData): Points {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    return { type: GeomType.Points, data, scales };
  }

  export function render(points: Points, layers: Layers) {
    const { scales } = points;

    const data = points.data;
    const { x, y } = data;
    const getRadius = makeGetter(data.area ?? Getter.constant(0.5, x.length));
    const layer = data[LAYER];

    for (let i = 0; i < x.length; i++) {
      const px = Scale.pushforward(scales.x, x[i]);
      const py = Scale.pushforward(scales.y, y[i]);
      const pr = Scale.pushforward(scales.area, getRadius(i));

      Frame.point(layers[layer[i] as DataLayer], px, py, { radius: pr });
    }
  }

  export function check(points: Points, selection: Rect) {
    const { scales, data } = points;
    const { x, y } = data;
    const getRadius = makeGetter(data.area ?? Getter.constant(0.5, x.length));
    const getPositions = makeGetter(data[POSITIONS]);

    const selected = [] as number[];

    for (let i = 0; i < x.length; i++) {
      const px = Scale.pushforward(scales.x, x[i]);
      const py = Scale.pushforward(scales.y, y[i]);
      let pr = Scale.pushforward(scales.area, getRadius(i));
      pr = pr / Math.sqrt(2);

      if (rectsIntersect(selection, [px - pr, py - pr, px + pr, py + pr])) {
        const positions = getPositions(i);
        for (let j = 0; j < positions.length; j++) selected.push(positions[j]);
      }
    }

    return selected;
  }
}
