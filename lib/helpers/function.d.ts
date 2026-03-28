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
		? (f & { arg: arg })["return"]
		: (f & { arg: arg })["return"] extends infer res extends f["_RT"]
			? res
			: never;

	export type pipe<acc, fs extends Fn[]> = fs extends [
		infer head extends Fn,
		...infer tail extends Fn[],
	]
		? pipe<call<head, acc>, tail>
		: acc;

	export interface compose<f extends Fn, g extends Fn>
		extends Fn<g["arg"], f["_RT"]> {
		return: call<f, call<g, this["arg"]>>;
	}

	export type fold<f, args extends unknown[]> = f extends Fn
		? args extends [infer only]
			? call<f, only>
			: args extends [infer head, ...infer tail]
				? fold<call<f, head>, tail>
				: never
		: never;
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
