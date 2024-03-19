import { times } from "utils";
import graphicParameters from "./graphicParameters.json";
import { Margins } from "./types";

export function getMargins() {
  const { marginLines, axisTitleFontsize } = graphicParameters;
  return marginLines.map(times(axisTitleFontsize)) as Margins;
}
