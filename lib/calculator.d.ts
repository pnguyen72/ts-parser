import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";
import type { many, num, Parser, parse, spaces, str } from "./parser";

export type evaluate<input extends string> = parse<
	$<spaces, "->", expr>,
	input
>;

type token<p extends Parser> = $<p, "<-", spaces>;
type strToken<s extends string> = token<str<s>>;

interface group extends Parser {
	return: $<
		this["arg"],
		"|>",
		$<strToken<"(">, "->", expr, "<-", strToken<")">>
	>;
}

type factor = $<
	$<factor.signs, "&&", $<token<num>, "||", group>>,
	">>|",
	factor.applySigns
>;
declare namespace factor {
	type signs = many<token<str<"+" | "-">>>;
	interface applySigns extends Fn<[unknown, number], number> {
		return: $<List.fold<applySign, this["arg"][1]>, "<|", this["arg"][0]>;
	}
	interface applySign extends Fn<[number, "+" | "-" | ""], number> {
		return: $<this["arg"][0], "*", multiplier[this["arg"][1]]>;
	}
	type multiplier = { "+": 1; "-": -1; "": 1 };
}

type term = $<factor, ">>=", term.loop>;
declare namespace term {
	interface loop extends Fn<number, Parser> {
		return: $<
			many<$<group, "||", $<strToken<"*">, "->", factor>>>,
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
					$<strToken<"+">, "->", term, ">>|", add>,
					"||",
					$<strToken<"-">, "->", term, ">>|", subtract>
				>
			>,
			">>|",
			List.fold<Fn.apply, this["arg"]>
		>;
	}
	type add = Fn.curry<Num.add>;
	type subtract = Fn.curry<Fn.flip<Num.subtract>>;
}
