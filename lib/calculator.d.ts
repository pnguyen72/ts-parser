import type { $, Fn, Fn2, List, Num } from "./helpers";
import type { char, many, many1, maybe, Parser, parse, pure } from "./parser";

export type evaluate<input extends string> = parse<
	$<spaces, "*>", expression>,
	input
>;

/* Tokens */

type spaces = many<$<char<" ">, "<|>", char<"\t">, "<|>", char<"\n">>>;
type token<p extends Parser> = $<p, "<*", spaces>;
type charTok<s extends string> = token<char<s>>;

type num = token<
	$<
		$<num.digits, "<&>", num.decimals>,
		">>|",
		$<List.concat, ">>", List.toStr, ">>", Num.fromStr>
	>
>;
declare namespace num {
	type digits = many1<
		char<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9">
	>;
	type decimals = maybe<$<char<".">, "<&>", digits, ">>|", List.cons>, []>;
}

type sign<p extends Parser<number>> = $<
	$<many<charTok<"+" | "-">>, "<&>", p>,
	">>|",
	sign.apply
>;
declare namespace sign {
	interface apply extends Fn<[unknown, number]> {
		return: List.foldRight<aux, this["arg"][0], this["arg"][1]>;
	}
	interface aux extends Fn<["+" | "-", number]> {
		return: $<this["arg"][0] extends "-" ? -1 : 1, "*", this["arg"][1]>;
	}
}

type parens<p extends Parser> = $<charTok<"(">, "*>", p, "<*", charTok<")">>;

type add = $<charTok<"+">, "*>", $<Fn.curry<Num.add>, "|>", pure>>;
type mul = $<charTok<"*">, "*>", $<Fn.curry<Num.multiply>, "|>", pure>>;
type sub = $<charTok<"-">, "*>", $<Fn.curry<Num.subtract>, "|>", pure>>;
type div = $<charTok<"/">, "*>", $<Fn.curry<Num.divide>, "|>", pure>>;
type implicitMul = $<Fn.curry<Num.multiply>, "|>", pure>;

/* Grammar */

// group = parens<expression>, but wrapped in an interface to allow mutual recursion
interface group extends Parser {
	return: $<parens<expression>, "<|", this["arg"]>;
}
type factor = sign<$<num, "<|>", group>>;
type juxtapos = chain<factor, implicitMul, group>;
type term = chain<juxtapos, $<mul, "<|>", div>>;
type expression = chain<term, $<add, "<|>", sub>>;

type chain<
	arg extends Parser,
	op extends Parser<Fn2>,
	loopArg extends Parser = arg,
> = $<arg, ">>=", chain.loop<op, loopArg>>;
declare namespace chain {
	interface loop<op extends Parser<Fn2>, arg extends Parser> extends Fn {
		return: $<
			many<$<op, "<&>", arg>>,
			">>|",
			List.foldLeft<applyOp, this["arg"]>
		>;
	}
	interface applyOp extends Fn<[unknown, [Fn2, unknown]]> {
		return: this["arg"] extends [infer acc, [infer f, infer arg]]
			? $<f, "<|", acc, "<|", arg>
			: never;
	}
}
