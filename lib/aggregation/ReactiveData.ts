import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { Dataframe, Indexables } from "../utils/types";
import { Factor } from "./Factor";

export interface ReactiveData<
  T extends Dataframe = any,
  U extends Factor = any,
  V extends Record<string, any> = any
> {
  data: T;
  factor: U;
  parameters: V;
  defaults: V;
  dispatch: EventTarget;
}

type EventType = `changed` | `recomputed`;

export namespace ReactiveData {
  export function of<
    T extends Indexables,
    U extends Record<string, any>,
    V extends Factor,
    W extends Dataframe
  >(
    data: T,
    parameters: U,
    factorfn: (data: T, parameters: U) => V,
    computefn: (data: T, factor: V, parameters: U) => W
  ) {
    const factor = factorfn(data, parameters);
    const newData = { ...computefn(data, factor, parameters), ...factor.data };
    const defaults = { ...parameters };
    const dispatch = new EventTarget();

    const reactiveData = {
      data: newData,
      factor,
      parameters,
      defaults,
      dispatch,
    };

    ReactiveData.listen(reactiveData, `changed`, () => {
      const { parameters } = reactiveData;
      const factor = factorfn(data, parameters);
      const result = computefn(data, factor, parameters);

      for (const [k, v] of Object.entries(result)) {
        reactiveData.data[k].length = 0;
        for (let i = 0; i < v.length; i++) reactiveData.data[k].push(v[i]);
      }

      for (const [k, v] of Object.entries(factor.data)) {
        reactiveData.data[k].length = 0;
        for (let i = 0; i < v.length; i++) reactiveData.data[k].push(v[i]);
      }
    });

    return reactiveData;
  }

  export const listen = makeListenFn<ReactiveData, EventType>();
  export const dispatch = makeDispatchFn<ReactiveData, EventType>();

  export function set<U extends Record<string, any>>(
    data: ReactiveData<any, any, U>,
    setfn: (parameters: U) => void,
    options?: { default?: boolean; silent?: boolean }
  ) {
    setfn(data.parameters);
    if (options?.default) setfn(data.defaults);
    if (!options?.silent) ReactiveData.dispatch(data, `changed`);
  }
}
