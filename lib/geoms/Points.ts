import { Frame } from "../plot/Frame";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { Dataframe } from "../utils/Dataframe";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { DataLayers, Indexable, Point, Rect } from "../utils/types";
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
    const [x, y, radius] = Geom.scaledArrays(n, [
      [data.x, scales.x],
      [data.y, scales.y],
      [data.size, scales.size],
    ]);

    const frames = Geom.frames(n, data[LAYER], layers);
    Frame.points(frames, x, y, radius);
  }

  export function check(points: Points, selection: Rect) {
    const { scales } = points;
    const data = Geom.flatData(points);

    const n = findLength(Object.values(data));
    const { x, y, size: radius } = Getter.mapObject(data);
    const positions = Getter.of(data[Factor.POSITIONS]);

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
    const groupedData = Geom.groupedData(points);

    const n = findLength(Object.values(data));
    const { x, y, size: radius } = Getter.mapObject(data);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      let ri = Scale.pushforward(scales.size, radius(i));
      ri = ri / Math.sqrt(2);

      const coords = [xi - ri, yi - ri, xi + ri, yi + ri] as Rect;

      if (pointInRect(position, coords)) {
        const childIndices = data[Factor.CHILD_INDICES];
        if (childIndices.length === 0 || childIndices[i].length === 1) {
          return Dataframe.getQueryRow(data, i);
        }

        const rows = childIndices[i].map((x: number) => {
          const row = Dataframe.getQueryRow(groupedData, x);
          (row as any)[LAYER] = (groupedData as any)[LAYER][x];
          return row;
        });

        return rows;
      }
    }
  }
}
