import {
  newBarplot,
  newFluctplot,
  newHistogram,
  newHistogram2D,
  newNoteplot,
  newPCoordsplot,
} from "../main";
import { newScatter } from "./Scatterplot";

export const plotMap = {
  scatter: newScatter,
  bar: newBarplot,
  histo: newHistogram,
  fluct: newFluctplot,
  histo2d: newHistogram2D,
  pcoords: newPCoordsplot,
  note: newNoteplot,
};

export type PlotMap = typeof plotMap;
export type PlotKey = keyof PlotMap;
