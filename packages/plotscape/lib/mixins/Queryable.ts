export interface Queryable {
  _isQueryable: boolean;
  isQueryable(): boolean;
  setQueryable(queryable: boolean): this;
}

export function queryable<T>(object: T): T & Queryable {
  return {
    ...object,
    _isQueryable: false,
    isQueryable,
    setQueryable,
  } satisfies T & Queryable;
}

function isQueryable(this: Queryable) {
  return this._isQueryable;
}

function setQueryable(this: Queryable, queryable: boolean) {
  this._isQueryable = queryable;
  return this;
}
