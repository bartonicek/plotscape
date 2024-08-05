import { Dataframe, Scene } from "@abartonicek/plotscape5";
import { Lines } from "../geoms/Lines";
import { Expanse, Plot, Scale } from "../main";
import { Marker } from "../scene/Marker";
import { Meta } from "../utils/Meta";
import { LAYER, POSITIONS } from "../utils/symbols";

export function Lineplot<T extends Dataframe>(
  scene: Scene<T>,
  selectfn: (data: T) => number[][],
) {
  const { data, marker } = scene;
  const plot = Plot.of({ type: Plot.Type.Line });

  const vars = selectfn(data);
  const names = vars.map(Meta.getName);

  const x = (index: number) => names;
  const y = (index: number) => vars.map((e) => e[index]);

  const { scales } = plot;
  const yDomains = vars.map((x) => Expanse.infer(x));
  const yCodomains = vars.map(() => scales.y.codomain);
  scales.y.domain = Expanse.compound(yDomains);
  scales.y.codomain = Expanse.compound(yCodomains) as any;

  Scale.train(scales.x, names, { default: true });
  Scale.train(scales.y, vars, { default: true });

  const layer = Marker.getLayer(marker);
  const position = (index: number) => [index];
  const coordinates = { x, y, [LAYER]: layer, [POSITIONS]: position };

  const lines = Lines.of(
    { flat: coordinates, grouped: coordinates },
    { n: vars[0].length },
  );

  Plot.addGeom(plot, lines);

  return plot;
}
