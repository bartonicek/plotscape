import { CanvasFrame } from "../plot/CanvasFrame";
import { Scale } from "../scales/Scale";
import { Scales } from "../scales/Scales";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { Dataframe } from "../utils/Dataframe";
import { pointInRect, rectsIntersect } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { Indexable } from "../utils/Indexable";
import { Polymorphic } from "../utils/Polymorphic";
import { DataLayers, Point, Rect, satisfies } from "../utils/types";
import { Geom, GeomMethods } from "./Geom";

interface Data extends Dataframe {
  x: Indexable;
  y: Indexable;
  size?: Indexable;
}

export interface Points extends Geom {
  type: `points`;
  coordinates: Data[];
  scales: Scales;
}

// Check that polymorphic methods are implemented
satisfies<GeomMethods, typeof Points>;

export namespace Points {
  const type = `points` as const;

  export function of(coordinates: Data[], scales: Scales): Points {
    return Geom.of({ type, coordinates, scales });
  }

  // Polymorphic method implementations
  Polymorphic.set(Geom.render, type, render);
  Polymorphic.set(Geom.check, type, check);
  Polymorphic.set(Geom.query, type, query);

  export function render(points: Points, layers: DataLayers) {
    const { scales } = points;
    const data = Geom.groupedData(points);
    const n = Dataframe.findLength(data);

    const [x, y, radius] = Geom.scaledArrays(n, [
      [data.x, scales.x],
      [data.y, scales.y],
      [data.size, scales.size],
    ]);

    const frames = Geom.frames(n, data[LAYER] as any, layers);
    CanvasFrame.points(frames, x, y, radius);
  }

  export function check(points: Points, selection: Rect) {
    const { scales } = points;
    const data = Geom.flatData(points);
    const n = Dataframe.findLength(data);

    const { x, y, size: radius } = Getter.mapObject(data);
    const positions = Getter.of(data[Factor.POSITIONS]) as Getter<number[]>;

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
    const n = Dataframe.findLength(data);

    const { x, y, size: radius } = Getter.mapObject(data);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i));
      const yi = Scale.pushforward(scales.y, y(i));
      let ri = Scale.pushforward(scales.size, radius(i));
      ri = ri / Math.sqrt(2);

      const coords = [xi - ri, yi - ri, xi + ri, yi + ri] as Rect;

      if (pointInRect(position, coords)) {
        const childIndices = (data[Factor.CHILD_INDICES] as any)?.[i];
        return Geom.getQueryInfo(groupedData, childIndices);
      }
    }
  }
}
