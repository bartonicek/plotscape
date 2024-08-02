import { Dataframe, Scene } from "@abartonicek/plotscape5";
import { Points } from "../geoms/Points";
import { Plot, Scale } from "../main";
import { Marker } from "../scene/Marker";
import { LAYER, POSITIONS } from "../utils/symbols";

export function Scatterplot<T extends Dataframe>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], any[]]
) {
  const { data, marker } = scene;
  const plot = Plot.of({ type: Plot.Type.scatter });

  const [x, y, area] = selectfn(data);
  const { scales } = plot;

  Scale.train(scales.x, x, { default: true });
  Scale.train(scales.y, y, { default: true });
  if (area) Scale.train(scales.area, area, { default: true });

  const layer = Marker.getLayer(marker);
  const position = (index: number) => [index];
  const coordinates = { x, y, area, [LAYER]: layer, [POSITIONS]: position };

  const points = Points.of({ flat: coordinates, grouped: coordinates });
  Plot.addGeom(plot, points);

  return plot;
}
