import { Indexable } from "../mixins/Indexable";
import { Named } from "../mixins/Named";
import { Proxyable } from "../mixins/Proxyable";

export interface Variable<T extends string | number | unknown = unknown>
  extends Named,
    Indexable<T>,
    Proxyable<T> {}
