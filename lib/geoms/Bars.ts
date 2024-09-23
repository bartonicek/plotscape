import { Factor, Plot, Poly } from "../main";
import { Frame } from "../plot/Frame";
import { Scale } from "../scales/Scale";
import { LAYER } from "../scene/Marker";
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
  type: `bars`;
  data: (Data & FactorData)[];
  scales: Plot.Scales;

  vAnchor: VAnchor;
  hAnchor: HAnchor;
}

export namespace Bars {
  const type = `bars`;

  export function of(options?: { vAnchor?: VAnchor; hAnchor?: HAnchor }): Bars {
    // Will be definitely assigned when added to Plot
    const scales = {} as Plot.Scales;
    const data = [] as (Data & FactorData)[];

    const vAnchor = options?.vAnchor ?? VAnchor.Bottom;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;

    return { type, data, scales, vAnchor, hAnchor };
  }

  // Polymorphic method implementations
  Poly.set(Geom.render, type, render);
  Poly.set(Geom.check, type, check);
  Poly.set(Geom.query, type, query);

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
        return Geom.getQueryInfo(groupedData, childIndices ?? []);
      }
    }
  }
}
