import { Factor, Reducer, Scene } from "../main";
import { Reduced } from "../transformation/Reduced";
import { Summaries } from "../transformation/Summaries";
import { Dataframe, Indexable } from "../utils/types";

export function Fluctuationplot<T extends Dataframe>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: [(data: T) => any[], Reducer][];
  }
) {
  const { data, marker } = scene;
  let [cat1, cat2, values] = selectfn(data) as [
    any[],
    any[],
    Indexable<number>
  ];
  values = values ?? 1;

  const factor1 = Factor.product(Factor.from(cat1), Factor.from(cat2));
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const reducer = values && options?.reducer ? options.reducer : Reducer.sum;
  const qs = Summaries.formatQueries(options?.queries ?? [], data);

  const summaries = Summaries.of({ stat: [values, reducer], ...qs }, factors);
  const coordinates = Summaries.translate(summaries, [
    (d) => ({ x: d.label, y: 0, height: d.stat, width: 1 }),
    (d) => ({ x: d.label, y: 0, height: Reduced.stack(d.stat), width: 1 }),
  ]);
}
