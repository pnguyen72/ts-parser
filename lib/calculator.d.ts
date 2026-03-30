import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";
import type { int, many, Parser, parse, spaces, str } from "./parser";

export type evaluate<input extends string> = parse<expr, input>;

type token<s extends string> = $<str<s>, "<*", spaces>;

interface factor extends Parser {
	return: $<this["arg"], "|>", $<int, "<*", spaces, "||", group>>;
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
