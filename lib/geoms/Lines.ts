import { CanvasFrame } from "../plot/CanvasFrame";
import { Scale } from "../scales/Scale";
import { Scales } from "../scales/Scales";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { bimap, findLength, rectSegmentIntersect, sum } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { Indexable } from "../utils/Indexable";
import { Polymorphic } from "../utils/Polymorphic";
import { DataLayers, Point, Rect } from "../utils/types";
import { Geom } from "./Geom";

interface Data {
  x: Indexable<any[]>;
  y: Indexable<any[]>;
}

export interface Lines extends Geom {
  type: `lines`;
  coordinates: Data[];
  scales: Scales;
}

export namespace Lines {
  const type = `lines` as const;

  export function of(coordinates: Data[], scales: Scales): Lines {
    return Geom.of({ type, coordinates, scales });
  }

  // Polymorphic method implementations
  Polymorphic.set(Geom.render, type, render);
  Polymorphic.set(Geom.check, type, check);
  Polymorphic.set(Geom.query, type, query);

  export function render(lines: Lines, layers: DataLayers) {
    const { scales } = lines;
    const data = Geom.groupedData(lines);

    const n = findLength(Object.values(data));
    const [x, y] = Geom.scaledArrays(n, [
      [data.x, scales.x],
      [data.y, scales.y],
    ]);

    const frames = Geom.frames(n, data[LAYER], layers);
    CanvasFrame.lines(frames, x, y);
  }

  export function check(lines: Lines, selection: Rect) {
    const { scales } = lines;
    const data = Geom.flatData(lines);

    const n = findLength(Object.values(data));
    const { x, y } = Getter.mapObject(data);
    const positions = Getter.of(data[Factor.POSITIONS]);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i)) as unknown as number[];
      const yi = Scale.pushforward(scales.y, y(i)) as unknown as number[];

      for (let j = 1; j < xi.length; j++) {
        const coords = [xi[j - 1], yi[j - 1], xi[j], yi[j]] as Rect;

        if (rectSegmentIntersect(selection, coords)) {
          const pos = positions(i);
          for (let k = 0; k < pos.length; k++) selected.push(pos[k]);
        }
      }
    }

    return selected;
  }

  export function query(lines: Lines, position: Point) {
    let { scales } = lines;
    const data = Geom.flatData(lines);
    const groupedData = Geom.groupedData(lines);

    const n = findLength(Object.values(data));
    const { x, y } = Getter.mapObject(data);

    const pos = bimap([...position, ...position], [-1, -1, 1, 1], sum) as Rect;

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i)) as unknown as number[];
      const yi = Scale.pushforward(scales.y, y(i)) as unknown as number[];

      for (let j = 1; j < xi.length; j++) {
        const coords = [xi[j - 1], yi[j - 1], xi[j], yi[j]] as Rect;

        if (rectSegmentIntersect(pos, coords)) {
          const childIndices = data[Factor.CHILD_INDICES]?.[i];

          const xq = x(i);
          const yq = y(i);

          const result = {} as Record<string, any>;
          for (let i = 0; i < xq.length; i++) {
            result[xq[i]] = yq[i];
          }

          const index = childIndices[0];
          (result as any)[LAYER] = Getter.of(groupedData[LAYER])(index);
          return [result];
        }
      }
    }
  }
}
