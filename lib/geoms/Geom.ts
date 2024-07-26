import { Frame } from "../Frame";
import { Points } from "../Points";

export enum GeomType {
  Points,
}

export interface Geom {
  type: GeomType;
}

export namespace Geom {
  const namespaces: {
    [key in GeomType]: {
      render(geom: Geom, frame: Frame): void;
    };
  } = {
    [GeomType.Points]: Points,
  };

  export function render<T extends Geom>(geom: T, frame: Frame) {
    namespaces[geom.type].render(geom, frame);
  }
}
