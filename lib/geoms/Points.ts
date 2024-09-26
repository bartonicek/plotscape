import { Frame } from "../plot/Frame";
import { Scale } from "../scales/Scale";
import { Scales } from "../scales/Scales";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { Poly } from "../utils/Poly";
import { DataLayers, Indexable, Point, Rect } from "../utils/types";
import { Geom } from "./Geom";

interface Data {
  x: Indexable;
  y: Indexable;
  size?: Indexable<number>;
}

export interface Points extends Geom {
  type: `points`;
  coordinates: Data[];
  scales: Scales;
}

export namespace Points {
  const type = `points` as const;

  export function of(coordinates: Data[], scales: Scales): Points {
    return Geom.of({ type, coordinates, scales });
  }

  // Polymorphic method implementations
  Poly.set(Geom.render, type, render);
  Poly.set(Geom.check, type, check);
  Poly.set(Geom.query, type, query);

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
        const childIndices = data[Factor.CHILD_INDICES]?.[i];
        return Geom.getQueryInfo(groupedData, childIndices);
      }
    }
  }
}
