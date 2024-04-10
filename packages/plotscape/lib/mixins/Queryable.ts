export interface Queryable {
  _isQueryable: boolean;
  isQueryable(): boolean;
  setQueryable(queryable: boolean): this;
}

export function queryable<T>(object: T): T & Queryable {
  const _isQueryable = true;
  const result = {
    ...object,
    _isQueryable,
    isQueryable,
    setQueryable,
  };
  return result;
}

function isQueryable(this: Queryable) {
  return this._isQueryable;
}

function setQueryable(this: Queryable, queryable: boolean) {
  this._isQueryable = queryable;
  return this;
}
