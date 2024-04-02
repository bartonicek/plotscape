/** Can be assigned a name. */
export interface Named {
  _name: string | undefined;
  name(): string;
  hasName(): boolean;
  setName(name?: string): this;
}

export function named<T>(object: T): T & Named {
  const _name = undefined as string | undefined;
  const result = { ...object, _name, name, hasName, setName };
  return result;
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
