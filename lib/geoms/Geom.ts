import { Frame } from "../Frame";
import { Layers } from "../utils/types";
import { Points } from "./Points";

export enum GeomType {
  Points,
}

export interface Geom {
  type: GeomType;
}

export namespace Geom {
  const namespaces: {
    [key in GeomType]: { render(geom: Geom, layers: Layers): void };
  } = {
    [GeomType.Points]: Points,
  };

  export function render<T extends Geom>(geom: T, layers: Layers) {
    namespaces[geom.type].render(geom, layers);
  }
}
