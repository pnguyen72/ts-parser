import type { $, Fn } from "./function.d.ts";

export interface toStr extends Fn {
	return: toStr.impl<this["arg"]>;
}
declare namespace toStr {
	type impl<l, acc extends string = ""> = l extends [
		infer head extends string | number,
		...infer tail,
	]
		? impl<tail, `${acc}${head}`>
		: acc;
}

export interface foldLeft<
	f extends Fn<[unknown, unknown]>,
	acc extends f["arg"][0],
> extends Fn {
	return: foldLeft.impl<f, acc, this["arg"]>;
}
declare namespace foldLeft {
	type impl<f extends Fn, acc, l> = l extends [infer head, ...infer tail]
		? impl<f, $<f, "<|", [acc, head]>, tail>
		: acc;
}

export type foldRight<
	f extends Fn<[unknown, unknown]>,
	l,
	acc extends f["arg"][1],
> = l extends [...infer head, infer tail]
	? foldRight<f, head, $<f, "<|", [tail, acc]>>
	: acc;

export interface cons extends Fn<[unknown, unknown]> {
	return: this["arg"] extends [infer head, infer tail extends unknown[]]
		? [head, ...tail]
		: never;
}

export interface concat extends Fn<[unknown, unknown]> {
	return: this["arg"] extends [
		infer head extends unknown[],
		infer tail extends unknown[],
	]
		? [...head, ...tail]
		: this["arg"];
}
