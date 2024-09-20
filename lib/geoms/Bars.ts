import { Factor, Plot } from "../main";
import { Frame } from "../plot/Frame";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
import { Dataframe } from "../utils/Dataframe";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Getter } from "../utils/Getter";
import {
  DataLayers,
  HAnchor,
  Indexable,
  Point,
  Rect,
  VAnchor,
} from "../utils/types";
import { FactorData, Geom } from "./Geom";

type Data = {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
};

export interface Bars extends Geom {
  type: Geom.Type.Bars;
  data: (Data & FactorData)[];
  scales: Plot.Scales;

  vAnchor: VAnchor;
  hAnchor: HAnchor;
}

export namespace Bars {
  export function of(options?: { vAnchor?: VAnchor; hAnchor?: HAnchor }): Bars {
    const scales = {} as Plot.Scales; // Will be definitely assigned when added to Plot
    const data = [] as (Data & FactorData)[];

    const type = Geom.Type.Bars;
    const vAnchor = options?.vAnchor ?? VAnchor.Bottom;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;

    return { type, data, scales, vAnchor, hAnchor };
  }

  export function render(bars: Bars, layers: DataLayers) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = Geom.groupedData(bars);

    const n = findLength(Object.values(data));
    const [x, y, width, height] = Geom.scaledArrays(n, [
      [data.x, scales.x],
      [data.y, scales.y],
      [data.width, scales.width],
      [data.height, scales.height],
    ]);

    const frames = Geom.frames(n, data[LAYER], layers);
    Frame.rectanglesWH(frames, x, y, width, height, { hAnchor, vAnchor });
  }

  export function check(bars: Bars, selection: Rect) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = Geom.flatData(bars);

    const n = findLength(Object.values(data));
    const { x, y, width, height } = Getter.mapObject(data);
    const positions = Getter.of(data[Factor.POSITIONS]);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      let xi = Scale.pushforward(scales.x, x(i));
      let yi = Scale.pushforward(scales.y, y(i));
      let wi = Scale.pushforward(scales.width, width(i));
      let hi = Scale.pushforward(scales.height, height(i));

      const coords = [xi, yi, wi, hi] as Rect;

      [xi, yi, wi, hi] = coords;

      const rectCoords = [
        xi - wi * hAnchor,
        yi - hi * vAnchor,
        xi + wi * hAnchor,
        yi + hi * (1 - vAnchor),
      ] as Rect;

      if (rectsIntersect(selection, rectCoords)) {
        const pos = positions(i);
        for (let j = 0; j < pos.length; j++) selected.push(pos[j]);
      }
    }

    return selected;
  }

  export function query(bars: Bars, position: Point) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = Geom.flatData(bars);
    const groupedData = Geom.groupedData(bars);

    const n = findLength(Object.values(data));
    const { x, y, width, height } = Getter.mapObject(data);

    for (let i = 0; i < n; i++) {
      let xi = Scale.pushforward(scales.x, x(i));
      let yi = Scale.pushforward(scales.y, y(i));
      let wi = Scale.pushforward(scales.width, width(i));
      let hi = Scale.pushforward(scales.height, height(i));

      const coords = [xi, yi, wi, hi] as Rect;

      [xi, yi, wi, hi] = coords;

      const rectCoords = [
        xi - wi * hAnchor,
        yi - hi * vAnchor,
        xi + wi * hAnchor,
        yi + hi * (1 - vAnchor),
      ] as Rect;

      if (pointInRect(position, rectCoords)) {
        const childIndices = data[Factor.CHILD_INDICES]?.[i];
        if (!childIndices || childIndices.length === 1) {
          return Dataframe.getQueryRow(data, i);
        }

        const flatRow = Dataframe.getQueryRow(data, i, { reduced: `exclude` });
        const rows = [flatRow];

        for (let j = 0; j < childIndices.length; j++) {
          const index = childIndices[j];
          const row = Dataframe.getQueryRow(groupedData, index, {
            reduced: `only`,
          });
          (row as any)[LAYER] = (groupedData as any)[LAYER][index];
          rows.push(row);
        }

        return rows;

        // const childIndices = data[Factor.CHILD_INDICES];

        // if (childIndices.length === 0 || childIndices[i].length === 1) {
        //   const flatQueryRow = Dataframe.getQueryRow(data, i);
        //   return flatQueryRow;
        // }

        // const exclude = [] as string[];
        // for (const v of Object.values(data)) {
        //   if (Meta.get(v, `reduced`) || !Meta.has(v, `name`)) continue;
        //   exclude.push(Meta.get(v, `name`) as string);
        // }

        // const flatQueryRow = Dataframe.getQueryRow(data, i);

        // for (const k of Object.keys(flatQueryRow)) {
        //   if (!exclude.includes(k)) delete flatQueryRow[k];
        // }

        // const rows = [flatQueryRow];

        // for (let j = 0; j < childIndices[i].length; j++) {
        //   const index = childIndices[i][j];
        //   const groupedRow = Dataframe.getQueryRow(groupedData, index, {
        //     exclude,
        //   });

        //   (groupedRow as any)[LAYER] = (groupedData as any)[LAYER][index];
        //   rows.push(groupedRow);
        // }

        // return rows;
      }
    }
  }
}
