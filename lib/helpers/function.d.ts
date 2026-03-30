export type $<
	arg0,
	op1 extends keyof infixOperators,
	arg1,
	op2 extends keyof infixOperators = never,
	arg2 = never,
> = infix<[arg0, op1, arg1, ...([op2] extends [never] ? [] : [op2, arg2])]>;
type infix<args> = args extends [
	infer arg0,
	infer op extends keyof infixOperators,
	infer arg1,
	...infer rest,
]
	? infix<[Fn.call<infixOperators[op], [arg0, arg1]>, ...rest]>
	: args extends [infer only]
		? only
		: never;

declare global {
	interface infixOperators {
		">>": Fn.chain;
		"|>": Fn.apply;
		"||>": Fn.bind;
	}
}

export interface Fn<Arg = unknown, Return = unknown> {
	arg: Arg;
	return: unknown;
	// doesn't do anything, just to allow annotating return type for readability
	_return: Return;
}

export namespace Fn {
	export interface constant<v> extends Fn<unknown, v> {
		return: v;
	}

	export type call<f extends Fn, arg> = (f & {
		arg: arg;
	})["return"];

	export interface flip<f extends Fn<[unknown, unknown]>>
		extends Fn<[f["arg"][1], f["arg"][0]]> {
		return: call<f, [this["arg"][1], this["arg"][0]]>;
	}

	export interface apply<T = unknown> extends Fn<[T, Fn<T>]> {
		return: call<this["arg"][1], this["arg"][0]>;
	}

	export interface chain extends Fn<[Fn, Fn]> {
		return: chainImpl<this["arg"][0], this["arg"][1]>;
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

	export interface bind extends Fn<[unknown, Fn<[unknown, unknown]>]> {
		return: bindImpl<this["arg"][0], this["arg"][1]>;
	}
}

interface chainImpl<f extends Fn, g extends Fn>
	extends Fn<f["arg"], g["_return"]> {
	return: $<this["arg"], "|>", f, "|>", g>;
}

interface curryImpl<f extends Fn<[unknown, unknown]>, arg> extends Fn {
	return: Fn.call<f, [arg, this["arg"]]>;
}

type bindImpl<
	arg extends f["arg"][0],
	f extends Fn<[unknown, unknown]>,
> = Fn.call<Fn.curry<f>, arg>;
