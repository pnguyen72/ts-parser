import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";
import type { char, many, many1, maybe, Parser, parse, spaces } from "./parser";

export type evaluate<input extends string> = parse<
	$<spaces, "->", expr>,
	input
>;

/* Helpers */

type token<p extends Parser> = $<p, "<-", spaces>;
type charTok<s extends string> = token<char<s>>;

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

/* Number parser */

type digits = many1<
	char<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9">
>;
type decimals = $<char<".">, "<&>", digits, ">>|", List.cons>;
type num = $<
	$<digits, "<&>", maybe<decimals, []>>,
	">>|",
	$<List.concat, ">>", List.join, ">>", Num.fromStr>
>;

/* Grammar (from highest to lowest precedence) */

interface group extends Parser {
	return: $<this["arg"], "|>", $<charTok<"(">, "->", expr, "<-", charTok<")">>>;
}

type factor = $<
	$<factor.signs, "<&>", $<token<num>, "<|>", group>>,
	">>|",
	factor.applySigns
>;
declare namespace factor {
	type signs = many<charTok<"+" | "-">>;
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
		$<charTok<"*">, "->", juxtapos, ">>|", Fn.curry<Num.multiply>>,
		"<|>",
		$<charTok<"/">, "->", juxtapos, ">>|", Fn.curry<Fn.flip<Num.divide>>>
	>
>;

type expr = chain<
	term,
	$<
		$<charTok<"+">, "->", term, ">>|", Fn.curry<Num.add>>,
		"<|>",
		$<charTok<"-">, "->", term, ">>|", Fn.curry<Fn.flip<Num.subtract>>>
	>
>;
