import { ExpanseContinuous, Scale } from "../main";
import { Frame } from "../plot/Frame";
import { findLength, rectsIntersect } from "../utils/funs";
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

    const n = findLength(Object.values(data));
    const [x, y, radius, layer] = Geom.get(data, [`x`, `y`, `area`, LAYER]);

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
    const [x, y, radius, positions] = Geom.get(data, [
      `x`,
      `y`,
      `area`,
      POSITIONS,
    ]);

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
}
