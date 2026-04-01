import type {
	char,
	digits,
	many,
	optional,
	Parser,
	parse,
	pure,
	spaces,
} from "@/parser";
import type { $, Fn, Fn2, List, Num, Str } from "@/utils";

export type calculate<input extends string> = parse<
	$<spaces, "*>", expression>,
	input
>;

/* Tokens */

type token<p extends Parser> = $<p, "<*", spaces>;
type charTok<c extends string> = token<char<c>>;

type num = token<
	$<
		digits,
		"<&>",
		optional<$<char<".">, "<&>", digits, ">>|", List.cons>, []>,
		">>|",
		$<List.concat, ">>", Str.fromList, ">>", Num.fromStr>
	>
>;

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

type add = $<charTok<"+">, "*>", pure<Fn.curry<Num.add>>>;
type mul = $<charTok<"*">, "*>", pure<Fn.curry<Num.multiply>>>;
type sub = $<charTok<"-">, "*>", pure<Fn.curry<Num.subtract>>>;
type div = $<charTok<"/">, "*>", pure<Fn.curry<Num.divide>>>;
type implicitMul = pure<Fn.curry<Num.multiply>>;

/* Grammar */

// group = parens<expression>, but wrapped in an interface to allow mutual recursion
interface group extends Parser {
	return: $<parens<expression>, "<|", this["arg"]>;
}
type factor = sign<$<num, "<|>", group>>;
type juxtapos = chain<factor, implicitMul, group>;
type term = chain<juxtapos, $<mul, "<|>", div>>;
type expression = chain<term, $<add, "<|>", sub>>;

export type chain<
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
