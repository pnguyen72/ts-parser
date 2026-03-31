import type { $, Fn } from "./function.d.ts";

export interface join extends Fn {
	return: join.impl<this["arg"]>;
}
declare namespace join {
	type impl<l, acc extends string = ""> = l extends [
		infer head extends string | number,
		...infer tail,
	]
		? impl<tail, `${acc}${head}`>
		: acc;
}

export interface fold<f extends Fn<[unknown, unknown]>, acc extends f["arg"][0]>
	extends Fn {
	return: fold.impl<f, acc, this["arg"]>;
}
declare namespace fold {
	type impl<f extends Fn, acc, l> = l extends [infer head, ...infer tail]
		? impl<f, $<f, "<|", [acc, head]>, tail>
		: acc;
}

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
		: this["arg"]
}
