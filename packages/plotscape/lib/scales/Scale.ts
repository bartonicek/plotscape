import { noopThis } from "utils";
import { Named, named } from "../mixins/Named";
import { Observable, observable } from "../mixins/Observable";
import { Widget } from "../widgets/Widget";
import { Expanse, isExpanseContinuous } from "./Expanse";
import { ExpanseContinuous, newExpanseContinuous } from "./ExpanseContinuous";

type Aesthetic = `x` | `y`;

/* -------------------------------- Interface ------------------------------- */

export interface Scale<T = unknown> extends Named, Observable {
  other?: Scale;
  aes?: Aesthetic;
  domain: Expanse<T>;
  norm: ExpanseContinuous;
  codomain: ExpanseContinuous;
  clone(): Scale<T>;
  setAes(aesthetic: Aesthetic): this;
  setOther(other: Scale): this;
  setDomain<V extends string | number>(domain: Expanse<V>): Scale<V>;
  setCodomain(codomain: ExpanseContinuous): this;

  setMin(value: number): this;
  setMax(value: number): this;

  setWeights(weights: number[]): this;
  setOrder(indices: number[]): this;
  setDefaultOrder(): this;
  setDefaultWeights(): this;
  getOrder(): number[] | undefined;

  pushforward(value: T): number;
  pullback(value: number): T;

  move(amount: number): this;
  freezeMin(): this;
  freezeMax(): this;

  link(other: Scale<T>): this;
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
  norm?: ExpanseContinuous,
  codomain?: ExpanseContinuous
): Scale<T> {
  domain = domain ?? (newExpanseContinuous() as unknown as Expanse<T>);
  norm = norm ?? newExpanseContinuous();
  codomain = codomain ?? newExpanseContinuous();

  const props = { domain, norm, codomain };
  const methods = {
    clone,
    setAes,
    setDomain,
    setCodomain,
    setOther,
    setMin,
    setMax,
    setOrder,
    setWeights,
    setDefaultOrder,
    setDefaultWeights,
    getOrder,
    pushforward,
    pullback,
    move,
    freezeMin,
    freezeMax,
    link,
    breaks,
    ratio,
    widget,
  };

  const self = observable(named({ ...props, ...methods }));
  self.norm.listen(() => self.emit());

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function clone<T>(this: Scale<T>) {
  return newScale(
    this.domain.clone(),
    this.norm.clone(),
    this.codomain.clone()
  );
}

function setAes<T>(this: Scale<T>, aes: Aesthetic) {
  this.aes = aes;
  return this;
}

function setOther<T>(this: Scale<T>, other: Scale) {
  this.other = other;
  return this;
}

function pushforward<T>(this: Scale<T>, value: T) {
  const { domain, norm, codomain } = this;
  return codomain.unnormalize(norm.unnormalize(domain.normalize(value)));
}

function pullback<T>(this: Scale<T>, value: number) {
  const { domain, norm, codomain } = this;
  return domain.unnormalize(norm.normalize(codomain.normalize(value)));
}

function setDomain<T>(this: Scale<T>, domain: Expanse<T>) {
  this.domain = domain;
  domain.listen(() => this.emit());
  return this as Scale<T>;
}

function setCodomain<T>(this: Scale<T>, codomain: ExpanseContinuous) {
  this.codomain = codomain;
  return this;
}

function setMin<T>(this: Scale<T>, value: number) {
  this.domain.setDefaultMin?.(value);
  return this;
}

function setMax<T>(this: Scale<T>, value: number) {
  this.domain.setDefaultMax?.(value);
  return this;
}

function setWeights<T>(this: Scale<T>, weights: number[]) {
  this.domain.setWeights?.(weights);
  return this;
}

function getOrder<T>(this: Scale<T>) {
  return this.domain.order;
}

function setOrder<T>(this: Scale<T>, indices: number[]) {
  this.domain.setOrder?.(indices);
  return this;
}

function setDefaultOrder<T>(this: Scale<T>) {
  this.domain.setDefaultOrder?.();
  return this;
}

function setDefaultWeights<T>(this: Scale<T>) {
  this.domain.setDefaultWeights?.();
  return this;
}

function move<T>(this: Scale<T>, amount: number) {
  const { min, max } = this.norm;
  this.norm.setMinMax(min + amount, max + amount);
  return this;
}

function link<T>(this: Scale<T>, other: Scale) {
  const move = this.move.bind(this);

  this.move = (amount: number) => {
    move(amount);
    other.move(amount);
    return this;
  };
  return this;
}

function breaks<T>(this: Scale<T>) {
  return this.domain.breaks(this.norm);
}

function freezeMin<T>(this: Scale<T>) {
  this.norm.setMin = noopThis;
  return this;
}

function freezeMax<T>(this: Scale<T>) {
  this.norm.setMax = noopThis;
  return this;
}

function ratio<T>(this: Scale<T>) {
  if (!isScaleContinuous(this)) return -1;
  const { domain, norm, codomain } = this;
  return domain.range() / norm.range() / codomain.range();
}

function widget<T>(this: Scale<T>) {
  const widget = this.domain.widget(this.norm);
  if (!widget) return undefined;
  return widget.setName(this.name());
}

/* --------------------------------- Helpers -------------------------------- */

export function isScaleContinuous(scale: Scale): scale is ScaleContinuous {
  return isExpanseContinuous(scale.domain);
}
