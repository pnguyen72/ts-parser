import type { $, Fn } from "./function.d.ts";

export interface singleton extends Fn {
	return: [this["arg"]];
}

export type foldLeft<
	f extends Fn<[unknown, unknown]>,
	acc extends f["arg"][0],
	l = never,
> = [l] extends [never] ? foldLeft.fn<f, acc> : foldLeft.impl<f, acc, l>;
declare namespace foldLeft {
	type impl<f extends Fn, acc, l> = l extends [infer head, ...infer tail]
		? impl<f, $<f, "<|", [acc, head]>, tail>
		: acc;
	interface fn<f extends Fn<[unknown, unknown]>, acc extends f["arg"][0]>
		extends Fn {
		return: impl<f, acc, this["arg"]>;
	}
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
