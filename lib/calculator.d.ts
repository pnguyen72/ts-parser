import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";
import type { many, many1, Parser, parse, spaces, str } from "./parser";

export type evaluate<input extends string> = parse<
	$<spaces, "->", expr>,
	input
>;

/* Helpers */

type token<p extends Parser> = $<p, "<-", spaces>;
type strToken<s extends string> = token<str<s>>;
type numToken = token<
	$<
		many1<str<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9">>,
		">>|",
		$<List.join, ">>", Num.fromStr>
	>
>;

type chain<head extends Parser, tail extends Parser> = $<
	head,
	">>=",
	chain.loop<tail>
>;
declare namespace chain {
	interface loop<tail extends Parser> extends Fn<number, Parser> {
		return: $<many<tail>, ">>|", List.fold<Fn.apply, this["arg"]>>;
	}
}

/* Grammar (from highest to lowest precedence) */

interface group extends Parser {
	return: $<
		this["arg"],
		"|>",
		$<strToken<"(">, "->", expr, "<-", strToken<")">>
	>;
}

type factor = $<
	$<factor.signs, "<&>", $<numToken, "<|>", group>>,
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

type juxtapos = $<factor, ">>=", juxtapos.loop>;
declare namespace juxtapos {
	interface loop extends Fn<number, Parser> {
		return: $<many<group>, ">>|", List.fold<Num.multiply, this["arg"]>>;
	}
}

type term = chain<
	juxtapos,
	$<
		$<strToken<"*">, "->", juxtapos, ">>|", Fn.curry<Num.multiply>>,
		"<|>",
		$<strToken<"/">, "->", juxtapos, ">>|", Fn.curry<Fn.flip<Num.divide>>>
	>
>;

type expr = chain<
	term,
	$<
		$<strToken<"+">, "->", term, ">>|", Fn.curry<Num.add>>,
		"<|>",
		$<strToken<"-">, "->", term, ">>|", Fn.curry<Fn.flip<Num.subtract>>>
	>
>;
