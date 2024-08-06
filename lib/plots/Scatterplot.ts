import { Dataframe, Scene } from "@abartonicek/plotscape5";
import { Points } from "../geoms/Points";
import { Plot, Scale } from "../main";
import { LAYER, Marker } from "../scene/Marker";
import { POSITIONS } from "../utils/symbols";

export function Scatterplot<T extends Dataframe>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], any[]],
) {
  const { data, marker } = scene;
  const plot = Plot.of({ type: Plot.Type.Scatter });

  const [x, y, size] = selectfn(data);
  const { scales } = plot;

  Scale.train(scales.x, x, { default: true });
  Scale.train(scales.y, y, { default: true });
  if (size) Scale.train(scales.size, size, { default: true });

  const layer = Marker.getLayer(marker);
  const position = (index: number) => [index];
  const coordinates = {
    x,
    y,
    area: size,
    [LAYER]: layer,
    [POSITIONS]: position,
  };

  const points = Points.of({ flat: coordinates, grouped: coordinates });
  Plot.addGeom(plot, points);

  return plot;
}
