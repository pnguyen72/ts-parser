import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";
import type { many, num, optional, Parser, parse, spaces, str } from "./parser";

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
	$<factor.sign, "&&", $<token<num>, "||", group>>,
	">>|",
	factor.applySign
>;
declare namespace factor {
	type sign = token<optional<str<"+" | "-">>>;
	interface applySign extends Fn<["+" | "-" | "", number], number> {
		return: $<[multiplier[this["arg"][0]], this["arg"][1]], "|>", Num.multiply>;
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
					$<strToken<"+">, "->", term, ">>|", Fn.curry<Num.add>>,
					"||",
					$<strToken<"-">, "->", term, ">>|", Fn.curry<Fn.flip<Num.subtract>>>
				>
			>,
			">>|",
			List.fold<Fn.apply, this["arg"]>
		>;
	}
}
