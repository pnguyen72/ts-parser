import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";
import type { parse as _parse, int, many, Parser, spaces, str } from "./parser";

export type parse<input extends string> = _parse<expr, input>;

type token<s extends string> = $<str<s>, "<*", spaces>;

interface factor extends Parser {
	return: Fn.call<$<int, "<*", spaces, "||", group>, this["arg"]>;
}

type group = $<token<"(">, "*>", expr, "<*", token<")">>;

type term = $<factor, ">>=", term.loop>;
declare namespace term {
	interface loop extends Fn<number, Parser> {
		return: $<
			many<$<token<"*">, "*>", factor, "||", group>>,
			">>|",
			List.fold<Num.multiply, this["arg"]>
		>;
	}
}

type expr = $<term, ">>=", expr.loop>;
declare namespace expr {
	interface loop extends Fn<number, Parser> {
		return: $<
			many<
				$<
					$<token<"+">, "*>", term, ">>|", Fn.curry<Num.add>>,
					"||",
					$<token<"-">, "*>", term, ">>|", Fn.curry<Fn.flip<Num.subtract>>>
				>
			>,
			">>|",
			List.fold<Fn.apply, this["arg"]>
		>;
	}
}
