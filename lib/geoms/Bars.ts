import { ExpanseContinuous, Frame, Scale } from "../main";
import { findLength, makeGetter, rectsIntersect } from "../utils/funs";
import { LAYER, POSITIONS } from "../utils/symbols";
import { DataLayer, Indexable, Layers, Rect } from "../utils/types";
import { FlatData, Geom, GeomType, GroupedData } from "./Geom";

type Data = {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
};

type Scales = {
  x: Scale<any, ExpanseContinuous>;
  y: Scale<any, ExpanseContinuous>;
  width: Scale<any, ExpanseContinuous>;
  height: Scale<any, ExpanseContinuous>;
};

export interface Bars extends Geom {
  type: GeomType.Bars;
  data: { flat: Data & FlatData; grouped: Data & GroupedData };
  scales: Scales;
}

export namespace Bars {
  export function of(data: {
    flat: Data & FlatData;
    grouped: Data & GroupedData;
  }): Bars {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot
    return { type: GeomType.Bars, data, scales };
  }

  export function render(points: Bars, layers: Layers) {
    const { scales } = points;
    const data = points.data.grouped;

    const { x, y, width, height } = data;
    const layer = data[LAYER];

    const n = findLength(Object.values(data));
    const [getX, getY, getWidth, getHeight, getLayer] = [
      x,
      y,
      width,
      height,
      layer,
    ].map(makeGetter);

    for (let i = 0; i < n; i++) {
      const px = Scale.pushforward(scales.x, getX(i));
      const py = Scale.pushforward(scales.y, getY(i));
      const pw = Scale.pushforward(scales.width, getWidth(i));
      const ph = Scale.pushforward(scales.height, getHeight(i));
      const layer = layers[getLayer(i) as DataLayer];

      Frame.rectangleWH(layer, px, py, pw, ph);
    }
  }

  export function check(points: Bars, selection: Rect) {
    const { scales } = points;
    const data = points.data.flat;

    const { x, y, width, height } = data;
    const positions = data[POSITIONS];

    const n = findLength(Object.values(data));
    const [getX, getY, getWidth, getHeight, getPositions] = [
      x,
      y,
      width,
      height,
      positions,
    ].map(makeGetter);

    const selected = [] as number[];

    for (let i = 0; i < n; i++) {
      const px = Scale.pushforward(scales.x, getX(i));
      const py = Scale.pushforward(scales.y, getY(i));
      const pw = Scale.pushforward(scales.width, getWidth(i)) / 2;
      const ph = Scale.pushforward(scales.height, getHeight(i)) / 2;

      if (rectsIntersect(selection, [px - pw, py - ph, px + pw, py + ph])) {
        const positions = getPositions(i);
        for (let j = 0; j < positions.length; j++) selected.push(positions[j]);
      }
    }

    return selected;
  }
}
