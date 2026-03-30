import type { nil } from "./nil";

export interface Fn<Arg = unknown, Return = unknown> {
	arg: Arg;
	_RT: Return;
	return: unknown;
}

export namespace Fn {
	export interface constant<v> extends Fn<unknown, v> {
		return: v;
	}

	export type call<
		f extends Fn,
		arg extends f["arg"],
	> = unknown extends f["_RT"]
		? callImpl<f, arg>
		: callImpl<f, arg> extends infer res extends f["_RT"]
			? res
			: never;

	export interface flip<f extends Fn<[unknown, unknown]>>
		extends Fn<[f["arg"][1], f["arg"][0]]> {
		return: call<f, [this["arg"][1], this["arg"][0]]>;
	}

	export interface apply<T = unknown> extends Fn<[T, Fn<T>]> {
		return: call<this["arg"][1], this["arg"][0]>;
	}

	export interface compose extends Fn<[Fn, Fn]> {
		return: composeImpl<this["arg"][0], this["arg"][1]>;
	}

	export type fold<f, args extends unknown[]> = f extends Fn
		? args extends [infer only]
			? call<f, only>
			: args extends [infer head, ...infer tail]
				? fold<call<f, head>, tail>
				: never
		: never;

	export interface curry<f extends Fn<[unknown, unknown]>>
		extends Fn<f["arg"][0]> {
		return: curryImpl<f, this["arg"]>;
	}

	export type bind<
		f extends Fn<[unknown, unknown]>,
		arg extends f["arg"][0],
	> = call<curry<f>, arg>;
}

declare global {
	interface infixOperators {
		"<<": Fn.compose;
	}
}

type callImpl<f extends Fn, arg> = (f & { arg: arg })["return"];

interface composeImpl<f extends Fn, g extends Fn>
	extends Fn<g["arg"], f["_RT"]> {
	return: Fn.call<f, Fn.call<g, this["arg"]>>;
}

interface curryImpl<f extends Fn<[unknown, unknown]>, arg> extends Fn {
	return: Fn.call<f, [arg, this["arg"]]>;
}

export type $<
	arg0,
	op1 extends keyof infixOperators,
	arg1,
	op2 extends keyof infixOperators | nil = nil,
	arg2 = unknown,
> = infix<[arg0, op1, arg1, ...(op2 extends nil ? [] : [op2, arg2])]>;
type infix<args> = args extends [
	infer arg0,
	infer op extends keyof infixOperators,
	infer arg1,
	...infer rest,
]
	? // @ts-expect-error: cannot type-check that arg0, arg1 are valid for op
		infix<[Fn.call<infixOperators[op], [arg0, arg1]>, ...rest]>
	: args extends [infer only]
		? only
		: never;
