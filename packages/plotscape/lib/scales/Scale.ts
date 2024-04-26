import { MapFn } from "utils";
import { Named, named } from "../mixins/Named";
import { Observable, observable } from "../mixins/Observable";
import { Widget } from "../widgets/Widget";
import { Expanse, isExpanseDiscrete } from "./Expanse";
import {
  ExpanseContinuous,
  isExpanseContinuous,
  newExpanseContinuous,
} from "./ExpanseContinuous";
import { isExpanseDiscreteWeighted } from "./ExpanseDiscreteWeighted";

type Aesthetic = `x` | `y`;

export enum Type {
  Nominal,
  Ordinal,
  Interval,
  Ratio,
}

/* -------------------------------- Interface ------------------------------- */

/**
 * Maps values from one expanse (domain) to another (codomain) and back.
 * */
export interface Scale<T = unknown> extends Named, Observable {
  other?: Scale;
  aes?: Aesthetic;
  type: Type;

  domain: Expanse<T>;
  codomain: ExpanseContinuous;

  clone(): Scale<T>;
  setAes(aesthetic: Aesthetic): this;
  setType(type: Type): this;
  setOther(other: Scale): this;
  setDomain<V extends string | number>(domain: Expanse<V>): Scale<V>;
  setCodomain(codomain: ExpanseContinuous): this;

  pushforward(value: T): number;
  pullback(value: number): T;

  link(other: Scale<T>): this;
  expand(zero: number, one: number, options?: { default?: boolean }): this;
  move(amount: number): this;
  freezeZero(): this;
  freezeOne(): this;
  flip(): this;

  // Continuous domain methods
  setMin(value: number, options?: { default?: boolean }): this;
  setMax(value: number, options?: { default?: boolean }): this;
  setMinMax(min: number, max: number, options?: { default?: boolean }): this;
  setZeroOne(zero: number, one: number, options?: { default?: boolean }): this;
  setTransform(trans: MapFn<number, number>, inv: MapFn<number, number>): this;

  // Discrete domain methods
  setWeights(weights: number[]): this;
  setOrder(indices: number[]): this;
  setDefaultOrder(): this;
  setDefaultWeights(): this;
  getOrder(): number[] | undefined;

  breaks(): T[];
  ratio(): number;
  widget(): Widget | undefined;
}

export interface ScaleContinuous extends Scale<number> {
  domain: ExpanseContinuous;
}

/* ------------------------------- Constructor ------------------------------ */

export function newScale<T = number>(
  domain?: Expanse<T>,
  codomain?: ExpanseContinuous
): Scale<T> {
  const tag = `Scale`;
  const type = Type.Interval; // Default type
  domain = domain ?? (newExpanseContinuous() as unknown as Expanse<T>);
  codomain = codomain ?? newExpanseContinuous();

  const props = { [Symbol.toStringTag]: tag, type, domain, codomain };
  const methods = {
    clone,
    pushforward,
    pullback,
    setAes,
    setType,
    setDomain,
    setCodomain,
    setOther,
    setMin,
    setMax,
    setMinMax,
    setZeroOne,
    setTransform,
    setOrder,
    setWeights,
    setDefaultOrder,
    setDefaultWeights,
    getOrder,
    move,
    expand,
    freezeZero,
    freezeOne,
    flip,
    link,
    breaks,
    ratio,
    widget,
  };

  const self = observable(named({ ...props, ...methods })) satisfies Scale;

  domain.listen(() => self.emit());
  codomain.listen(() => self.emit());

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function clone<T>(this: Scale<T>) {
  return newScale(this.domain.clone(), this.codomain.clone());
}

function setAes<T>(this: Scale<T>, aes: Aesthetic) {
  this.aes = aes;
  return this;
}

function setOther<T>(this: Scale<T>, other: Scale) {
  this.other = other;
  return this;
}

function setType<T>(this: Scale<T>, type: Type) {
  this.type = type;

  if (type === Type.Ratio) {
    const { domain, codomain } = this;
    if (!isExpanseContinuous(domain) || !isExpanseContinuous(codomain)) {
      throw new Error(
        `A ratio scale must have a continuous domain and codomain.`
      );
    }
    domain.setMin(0, { default: true });
    codomain.setMin(0, { default: true });
  }

  return this;
}

function pushforward<T>(this: Scale<T>, value: T) {
  const { domain, codomain } = this;
  return codomain.unnormalize(domain.normalize(value));
}

function pullback<T>(this: Scale<T>, value: number) {
  const { domain, codomain } = this;
  return domain.unnormalize(codomain.normalize(value));
}

function setDomain<T>(this: Scale<T>, domain: Expanse<T>) {
  if (this.type === Type.Ratio) {
    if (!isExpanseContinuous(domain)) {
      throw new Error(`Ratio scale must have continuous domain.`);
    }
    this.domain = domain.setMin(0, { default: true });
    domain.listen(() => this.emit());
    return this as Scale<T>;
  }
  this.domain = domain;
  domain.listen(() => this.emit());
  return this as Scale<T>;
}

function setCodomain<T>(this: Scale<T>, codomain: ExpanseContinuous) {
  this.codomain = codomain;
  return this;
}

function setMin<T>(
  this: Scale<T>,
  value: number,
  options?: { default: boolean }
) {
  if (!isExpanseContinuous(this.domain)) return this;
  this.domain.setMin(value, options);
  return this;
}

function setMax<T>(
  this: Scale<T>,
  value: number,
  options?: { default: boolean }
) {
  if (!isExpanseContinuous(this.domain)) return this;
  this.domain.setMax(value, options);
  return this;
}

function setMinMax<T>(
  this: Scale<T>,
  min: number,
  max: number,
  options?: { default: boolean }
) {
  if (!isExpanseContinuous(this.domain)) return this;
  this.domain.setMinMax(min, max, options);
  return this;
}

function setZeroOne<T>(
  this: Scale<T>,
  zero: number,
  one: number,
  options?: { default?: boolean }
) {
  this.domain.setZeroOne(zero, one, options);
  return this;
}

function setTransform<T>(
  this: Scale<T>,
  trans: MapFn<number, number>,
  inv: MapFn<number, number>
) {
  if (!isExpanseContinuous(this.domain)) return this;
  this.domain.setTransform(trans, inv);
  return this;
}

function getOrder<T>(this: Scale<T>) {
  if (!isExpanseDiscrete(this.domain)) return [];
  return this.domain.order;
}

function setOrder<T>(this: Scale<T>, indices: number[]) {
  if (!isExpanseDiscrete(this.domain)) return this;
  this.domain.setOrder(indices);
  return this;
}

function setDefaultOrder<T>(this: Scale<T>) {
  if (!isExpanseDiscrete(this.domain)) return this;
  this.domain.setDefaultOrder();
  return this;
}

function setWeights<T>(this: Scale<T>, weights: number[]) {
  if (!isExpanseDiscreteWeighted(this.domain)) return this;
  this.domain.setWeights(weights);
  return this;
}

function setDefaultWeights<T>(this: Scale<T>) {
  if (!isExpanseDiscreteWeighted(this.domain)) return this;
  this.domain.setDefaultWeights();
  return this;
}

function move<T>(this: Scale<T>, amount: number) {
  this.domain.move(amount);
  return this;
}

function expand<T>(
  this: Scale<T>,
  zero: number,
  one: number,
  options?: { default?: boolean }
) {
  this.domain.expand(zero, one, options);
  return this;
}

function link<T>(this: Scale<T>, other: Scale) {
  this.domain.link(other.domain);
  return this;
}

function breaks<T>(this: Scale<T>) {
  return this.domain.breaks();
}

function freezeZero<T>(this: Scale<T>) {
  if (!isExpanseContinuous(this.domain)) return this;
  this.domain.freezeZero();
  return this;
}

function freezeOne<T>(this: Scale<T>) {
  if (!isExpanseContinuous(this.domain)) return this;
  this.domain.freezeOne();
  return this;
}

function flip<T>(this: Scale<T>) {
  if (!isExpanseContinuous(this.domain)) return this;
  this.domain.flip();
  return this;
}

function ratio<T>(this: Scale<T>) {
  if (!isScaleContinuous(this)) return -1;
  const { domain, codomain } = this;
  return domain.range() / codomain.range();
}

function widget<T>(this: Scale<T>) {
  const widget = this.domain.widget();
  if (!widget) return undefined;
  widget.setName(this.name());
  return widget;
}

/* --------------------------------- Helpers -------------------------------- */

export function isScaleContinuous(scale: Scale): scale is ScaleContinuous {
  return isExpanseContinuous(scale.domain);
}
