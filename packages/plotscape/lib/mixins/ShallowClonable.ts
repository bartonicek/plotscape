export interface ShallowCloneable {
  shallowClone(): this;
}

export function shallowCloneable<T>(object: T): T & ShallowCloneable {
  return { ...object, shallowClone };
}

function shallowClone(this: ShallowCloneable) {
  return { ...this };
}
