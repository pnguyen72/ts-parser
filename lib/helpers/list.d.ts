import type { Fn } from "./function.d.ts";

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
