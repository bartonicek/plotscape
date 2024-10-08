import { CanvasFrame } from "../plot/CanvasFrame";
import { Scale } from "../scales/Scale";
import { Scales } from "../scales/Scales";
import { LAYER } from "../scene/Marker";
import { Factor } from "../transformation/Factor";
import { findLength, pointInRect, rectsIntersect } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { Indexable } from "../utils/Indexable";
import { Polymorphic } from "../utils/Polymorphic";
import { DataLayers, HAnchor, Point, Rect, VAnchor } from "../utils/types";
import { Geom } from "./Geom";

interface Data {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
}

export interface Bars extends Geom {
  type: `bars`;
  coordinates: Data[];
  scales: Scales;

  vAnchor: VAnchor;
  hAnchor: HAnchor;
}

export namespace Bars {
  const type = `bars` as const;

  export function of(
    coordinates: Data[],
    scales: Scales,
    options?: { vAnchor?: VAnchor; hAnchor?: HAnchor },
  ): Bars {
    const vAnchor = options?.vAnchor ?? VAnchor.Bottom;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;

    return Geom.of({ type, coordinates, scales, vAnchor, hAnchor });
  }

  // Polymorphic method implementations
  Polymorphic.set(Geom.render, type, render);
  Polymorphic.set(Geom.check, type, check);
  Polymorphic.set(Geom.query, type, query);

  function render(bars: Bars, layers: DataLayers) {
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
    CanvasFrame.rectanglesWH(frames, x, y, width, height, { hAnchor, vAnchor });
  }

  function check(bars: Bars, selection: Rect) {
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

  function query(bars: Bars, position: Point) {
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
