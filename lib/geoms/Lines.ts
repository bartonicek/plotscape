import { Frame } from "../plot/Frame";
import { ExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { findLength, rectSegmentIntersect } from "../utils/funs";
import { POSITIONS } from "../utils/symbols";
import { DataLayer, DataLayers, Indexable, Point, Rect } from "../utils/types";
import { FlatData, Geom, GroupedData } from "./Geom";

type Data = {
  x: Indexable<any[]>;
  y: Indexable<any[]>;
};

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
};

export interface Lines extends Geom {
  n?: number;
  type: Geom.Type.Lines;
  data: { flat: Data & FlatData; grouped: Data & GroupedData };
  scales: Scales;
}

export namespace Lines {
  export function of(
    data: { flat: Data; grouped: Data },
    options?: { n?: number },
  ): Lines {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    const type = Geom.Type.Lines;
    const typedData = data as {
      flat: Data & FlatData;
      grouped: Data & GroupedData;
    };

    return { type, data: typedData, scales, n: options?.n };
  }

  export function render(lines: Lines, layers: DataLayers) {
    const { scales } = lines;
    const data = lines.data.grouped;

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
    const data = lines.data.flat;

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
    let { n, scales } = lines;
    const data = lines.data.flat;

    n = n ?? findLength(Object.values(data));
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

      for (let j = 1; j < x.length; j++) {
        const coords = [xi[j - 1], yi[j - 1], xi[j], yi[j]] as Rect;
        if (rectSegmentIntersect(pos, coords)) {
          return { xi, yi };
        }
      }
    }
  }
}