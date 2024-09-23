import { Frame } from "../plot/Frame";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { bimap, findLength, rectSegmentIntersect, sum } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { DataLayers, Indexable, Point, Rect } from "../utils/types";
import { FactorData, Geom } from "./Geom";

type Data = {
  x: Indexable<any[]>;
  y: Indexable<any[]>;
};

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
};

export interface Lines extends Geom {
  type: `lines`;
  data: (Data & FactorData)[];
  scales: Scales;
}

export namespace Lines {
  export function of(): Lines {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    const data = [] as (Data & FactorData)[];
    const type = `lines`;

    return { type, data, scales };
  }

  export function render(lines: Lines, layers: DataLayers) {
    const { scales } = lines;
    const data = Geom.groupedData(lines);

    const n = findLength(Object.values(data));
    const [x, y] = Geom.scaledArrays(n, [
      [data.x, scales.x],
      [data.y, scales.y],
    ]);

    const frames = Geom.frames(n, data[LAYER], layers);
    Frame.lines(frames, x, y);
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
