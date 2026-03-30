export type $<
	arg0,
	op1 extends keyof InfixOperators,
	arg1,
	op2 extends keyof InfixOperators = never,
	arg2 = never,
> = [op2] extends [never]
	? Fn.call<InfixOperators[op1], [arg0, arg1]>
	: $<Fn.call<InfixOperators[op1], [arg0, arg1]>, op2, arg2>;

declare global {
	interface InfixOperators {
		">>": Fn.chain;
		"|>": Fn.apply;
		"<|": Fn.flip<Fn.apply>;
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
