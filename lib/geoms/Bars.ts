import { ExpanseContinuous, Frame, Scale } from "../main";
import { findLength, makeGetter, rectsIntersect } from "../utils/funs";
import { LAYER, POSITIONS } from "../utils/symbols";
import {
  DataLayer,
  DataLayers,
  HAnchor,
  Indexable,
  Rect,
  VAnchor,
} from "../utils/types";
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

  vAnchor: VAnchor;
  hAnchor: HAnchor;
}

export namespace Bars {
  export function of(
    data: { flat: Data; grouped: Data },
    options?: {
      vAnchor?: VAnchor;
      hAnchor?: HAnchor;
    }
  ): Bars {
    const scales = {} as Scales; // Will be definitely assigned when added to Plot

    const type = GeomType.Bars;
    const vAnchor = options?.vAnchor ?? VAnchor.Bottom;
    const hAnchor = options?.hAnchor ?? HAnchor.Center;

    const typedData = data as {
      flat: Data & FlatData;
      grouped: Data & GroupedData;
    };

    return { type, data: typedData, scales, vAnchor, hAnchor };
  }

  export function render(bars: Bars, layers: DataLayers) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = bars.data.grouped;

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

      Frame.rectangleWH(layer, px, py, pw, ph, { hAnchor, vAnchor });
    }
  }

  export function check(bars: Bars, selection: Rect) {
    const { scales, hAnchor, vAnchor } = bars;
    const data = bars.data.flat;

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
      const pw = Scale.pushforward(scales.width, getWidth(i));
      const ph = Scale.pushforward(scales.height, getHeight(i));

      const coords = [
        px - pw * hAnchor,
        py - ph * vAnchor,
        px + pw * hAnchor,
        py + ph * (1 - vAnchor),
      ] as Rect;

      if (rectsIntersect(selection, coords)) {
        const positions = getPositions(i);
        for (let j = 0; j < positions.length; j++) selected.push(positions[j]);
      }
    }

    return selected;
  }
}
