import { Frame } from "../plot/Frame";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { findLength, rectSegmentIntersect } from "../utils/funs";
import { POSITIONS } from "../utils/symbols";
import { DataLayer, DataLayers, Indexable, Point, Rect } from "../utils/types";
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
  type: Geom.Type.Lines;
  data: (Data & FactorData)[];
  scales: Scales;
}

export namespace Lines {
  export function of(): Lines {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    const data = [] as (Data & FactorData)[];
    const type = Geom.Type.Lines;

    return { type, data, scales };
  }

  export function render(lines: Lines, layers: DataLayers) {
    const { scales } = lines;
    const data = Geom.groupedData(lines);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, LAYER] as const;
    const [x, y, layer] = Geom.getters(data, vars);

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i)) as unknown as number[];
      const yi = Scale.pushforward(scales.y, y(i)) as unknown as number[];
      const li = layers[layer(i) as DataLayer];

      Frame.line(li, xi, yi);
    }
  }

  export function check(lines: Lines, selection: Rect) {
    const { scales } = lines;
    const data = Geom.flatData(lines);

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, POSITIONS] as const;
    const [x, y, positions] = Geom.getters(data, vars);

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

    const n = findLength(Object.values(data));
    const vars = [`x`, `y`, POSITIONS] as const;
    const [x, y] = Geom.getters(data, vars);

    const pos = [
      position[0] - 1,
      position[1] - 1,
      position[0] + 1,
      position[1] + 1,
    ] as Rect;

    for (let i = 0; i < n; i++) {
      const xi = Scale.pushforward(scales.x, x(i)) as unknown as number[];
      const yi = Scale.pushforward(scales.y, y(i)) as unknown as number[];

      for (let j = 1; j < xi.length; j++) {
        const coords = [xi[j - 1], yi[j - 1], xi[j], yi[j]] as Rect;

        if (rectSegmentIntersect(pos, coords)) {
          const result = {} as Record<string, any>;
          const [xiu, yiu] = [x(i), y(i)];
          for (let k = 0; k < xiu.length; k++) result[xiu[k]] = yiu[k];
          return result;
        }
      }
    }
  }
}
