/** Can be assigned a name. */
export interface Named {
  _name: string | undefined;
  name(): string;
  hasName(): boolean;
  setName(name?: string): this;
}

export function named<T>(object: T): T & Named {
  return { ...object, _name: undefined, name, hasName, setName } satisfies T &
    Named;
}

function name(this: Named, fallback = `[name missing]`) {
  return this._name ?? fallback;
}

function hasName(this: Named) {
  return this._name != undefined;
}

function setName(this: Named, name?: string) {
  this._name = name;
  return this;
}
