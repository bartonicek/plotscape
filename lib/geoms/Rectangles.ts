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
import { DataLayers, Point, Rect } from "../utils/types";
import { Geom } from "./Geom";

interface Data extends Dataframe {
  x0: Indexable;
  y0: Indexable;
  x1: Indexable;
  y1: Indexable;
}

export interface Rectangles extends Geom {
  coordinates: Data[];
  scales: Scales;
}

export namespace Rectangles {
  const type = `rectangles` as const;

  export function of(coordinates: Data[], scales: Scales): Rectangles {
    return Geom.of({ type, coordinates, scales });
  }

  // Polymorphic method implementations
  Polymorphic.set(Geom.render, type, render);
  Polymorphic.set(Geom.check, type, check);
  Polymorphic.set(Geom.query, type, query);

  export function render(rectangles: Rectangles, layers: DataLayers) {
    const { scales } = rectangles;
    const data = Geom.groupedData(rectangles);
    const n = Dataframe.findLength(data);

    const [x0, y0, x1, y1, area] = Geom.scaledArrays(n, [
      [data.x0, scales.x],
      [data.y0, scales.y],
      [data.x1, scales.x],
      [data.y1, scales.y],
      [data.area, scales.areaPct],
    ]);

    const frames = Geom.frames(n, data[LAYER] as any, layers);
    CanvasFrame.rectanglesXY(frames, x0, y0, x1, y1, area);
  }

  export function check(rectangles: Rectangles, selection: Rect) {
    const { scales } = rectangles;
    const data = Geom.flatData(rectangles);

    const n = Dataframe.findLength(data);
    const { x0, y0, x1, y1, area } = Getter.mapObject(data);
    const positions = Getter.of(data[Factor.POSITIONS]) as Getter<number[]>;

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      let x0i = Scale.pushforward(scales.x, x0(i));
      let y0i = Scale.pushforward(scales.y, y0(i));
      let x1i = Scale.pushforward(scales.x, x1(i));
      let y1i = Scale.pushforward(scales.y, y1(i));

      if (data.area) {
        const ai = Scale.pushforward(scales.areaPct, area(i));
        const rxi = x1i - x0i;
        const ryi = y1i - y0i;

        x0i = x0i + ((1 - ai) / 2) * rxi;
        x1i = x1i - ((1 - ai) / 2) * rxi;
        y0i = y0i + ((1 - ai) / 2) * ryi;
        y1i = y1i - ((1 - ai) / 2) * ryi;
      }

      if (rectsIntersect(selection, [x0i, y0i, x1i, y1i])) {
        const pos = positions(i);
        for (let j = 0; j < pos.length; j++) selected.push(pos[j]);
      }
    }

    return selected;
  }

  export function query(rectangles: Rectangles, position: Point) {
    const { scales } = rectangles;
    const data = Geom.flatData(rectangles);
    const groupedData = Geom.groupedData(rectangles);

    const n = Dataframe.findLength(data);
    const { x0, y0, x1, y1, area } = Getter.mapObject(data);

    for (let i = 0; i < n; i++) {
      let x0i = Scale.pushforward(scales.x, x0(i));
      let y0i = Scale.pushforward(scales.y, y0(i));
      let x1i = Scale.pushforward(scales.x, x1(i));
      let y1i = Scale.pushforward(scales.y, y1(i));

      if (data.area) {
        const ai = Scale.pushforward(scales.areaPct, area(i));
        const rxi = x1i - x0i;
        const ryi = y1i - y0i;

        x0i = x0i + ((1 - ai) / 2) * rxi;
        x1i = x1i - ((1 - ai) / 2) * rxi;
        y0i = y0i + ((1 - ai) / 2) * ryi;
        y1i = y1i - ((1 - ai) / 2) * ryi;
      }

      if (pointInRect(position, [x0i, y0i, x1i, y1i])) {
        const childIndices = (data[Factor.CHILD_INDICES] as any)?.[i];
        return Geom.getQueryInfo(groupedData, childIndices);
      }
    }
  }
}
