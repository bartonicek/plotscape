import { Frame } from "./Frame";
import { Geom, GeomType } from "./geoms/Geom";
import { Scale } from "./main";

type PointData = {
  x: number[];
  y: number[];
  size?: number[];
};

type Scales = { x: Scale; y: Scale };

export interface Points extends Geom {
  type: GeomType.Points;
  data: PointData;
  scales: Scales;
}

export namespace Points {
  export function of(data: PointData, scales: Scales): Points {
    return { type: GeomType.Points, data, scales };
  }

  export function render(points: Points, frame: Frame) {
    const { scales } = points;
    let { x, y, size } = points.data;

    for (let i = 0; i < x.length; i++) {
      const px = Scale.pushforward(scales.x, x[i]);
      const py = Scale.pushforward(scales.y, y[i]);

      Frame.point(frame, px, py);
    }
  }
}
