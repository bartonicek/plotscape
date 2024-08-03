import { Getter } from "../Getter";
import { ExpanseContinuous, Scale } from "../main";
import { Frame } from "../plot/Frame";
import { findLength, makeGetter, rectsIntersect } from "../utils/funs";
import { LAYER, POSITIONS } from "../utils/symbols";
import { DataLayer, DataLayers, Indexable, Rect } from "../utils/types";
import { FlatData, Geom, GeomType, GroupedData } from "./Geom";

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
  type: GeomType.Points;
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

    return { type: GeomType.Points, data: typedData, scales };
  }

  export function render(points: Points, layers: DataLayers) {
    const { scales } = points;
    const data = points.data.grouped;

    const { x, y, area } = data;
    const layer = data[LAYER];

    const n = findLength([x, y, area, layer]);
    const [getX, getY, getLayer] = [x, y, layer].map(makeGetter);
    const getRadius = makeGetter(area ?? 0.5);

    for (let i = 0; i < n; i++) {
      const px = Scale.pushforward(scales.x, getX(i));
      const py = Scale.pushforward(scales.y, getY(i));
      const pr = Scale.pushforward(scales.area, getRadius(i));
      const layer = layers[getLayer(i) as DataLayer];

      Frame.point(layer, px, py, { radius: pr });
    }
  }

  export function check(points: Points, selection: Rect) {
    const { scales } = points;
    const data = points.data.flat;

    const { x, y, area } = data;
    const positions = data[POSITIONS];

    const n = findLength([x, y, area, positions]);
    const [getX, getY, getPositions] = [x, y, positions].map(makeGetter);
    const getRadius = makeGetter(area ?? Getter.constant(0.5));

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      const px = Scale.pushforward(scales.x, getX(i));
      const py = Scale.pushforward(scales.y, getY(i));
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
