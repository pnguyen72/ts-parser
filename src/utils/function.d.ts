export type $<
	arg0,
	op1 extends keyof InfixOperators,
	arg1,
	op2 extends keyof InfixOperators = never,
	arg2 = never,
> = [op2] extends [never]
	? callImpl<InfixOperators[op1], [arg0, arg1]>
	: $<callImpl<InfixOperators[op1], [arg0, arg1]>, op2, arg2>;

declare global {
	interface InfixOperators {
		">>": Fn.chain;
		"<|": Fn.call;
		"|>": Fn.apply;
		"||>": Fn.bind;
	}
}

// ret doesn't do anything, just to allow type annotation for readability
export interface Fn<arg = unknown, ret = unknown> {
	arg: arg;
	return: unknown;
	_ret: ret;
}

export type Fn2<arg1 = unknown, arg2 = unknown, ret = unknown> = Fn<
	arg1,
	Fn<arg2, ret>
>;

export namespace Fn {
	export interface id<T = unknown> extends Fn<T> {
		return: this["arg"];
	}

	export interface constant<v> extends Fn<unknown, v> {
		return: v;
	}

	export interface call extends Fn<[Fn, unknown]> {
		return: callImpl<this["arg"][0], this["arg"][1]>;
	}

	export interface flip<f extends Fn<[unknown, unknown]>>
		extends Fn<[f["arg"][1], f["arg"][0]]> {
		return: callImpl<f, [this["arg"][1], this["arg"][0]]>;
	}

	export type apply = flip<call>;

	export interface chain extends Fn<[Fn, Fn]> {
		return: chainImpl<this["arg"][0], this["arg"][1]>;
	}

	export interface curry<f extends Fn<[unknown, unknown]>> extends Fn2 {
		return: curryImpl<f, this["arg"]>;
	}

	export interface bind extends Fn<[unknown, Fn<[unknown, unknown]>]> {
		return: bindImpl<this["arg"][0], this["arg"][1]>;
	}
}

type callImpl<f extends Fn, arg> = (f & { arg: arg })["return"];

interface chainImpl<f extends Fn, g extends Fn>
	extends Fn<f["arg"], g["_ret"]> {
	return: $<this["arg"], "|>", f, "|>", g>;
}

interface curryImpl<f extends Fn<[unknown, unknown]>, arg>
	extends Fn2<f["arg"][0], f["arg"][1], f["_ret"]> {
	return: callImpl<f, [arg, this["arg"]]>;
}

type bindImpl<
	arg extends f["arg"][0],
	f extends Fn<[unknown, unknown]>,
> = callImpl<Fn.curry<f>, arg>;
