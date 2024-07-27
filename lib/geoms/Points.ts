import { Frame } from "../Frame";
import { Geom, GeomType } from "./Geom";
import { Scale } from "../main";
import { LAYER } from "../utils/symbols";
import { DataLayer, Layers } from "../utils/types";

type PointData = {
  x: number[];
  y: number[];
  size?: number[];
  [LAYER]: DataLayer[];
};

type Scales = { x: Scale; y: Scale; size: Scale };

export interface Points extends Geom {
  type: GeomType.Points;
  data: PointData;
  scales: Scales;
}

export namespace Points {
  export function of(data: PointData, scales: Scales): Points {
    return { type: GeomType.Points, data, scales };
  }

  export function render(points: Points, layers: Layers) {
    const { scales } = points;
    const { x, y, size } = points.data;
    const layer = points.data[LAYER];

    for (let i = 0; i < x.length; i++) {
      const px = Scale.pushforward(scales.x, x[i]);
      const py = Scale.pushforward(scales.y, y[i]);

      Frame.point(layers[layer[i]], px, py);
    }
  }
}
