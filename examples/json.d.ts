import type {
	char,
	choice,
	digits,
	fail,
	literal,
	many,
	notChar,
	optional,
	Parser,
	parse,
	pure,
	spaces,
} from "@/parser";
import type { $, Fn, List, Num, Str } from "@/utils";

export type parseJson<s extends string> = parse<token<value>, s>;

/* Main */

interface value extends Parser {
	return: $<
		List.foldLeft<choice, fail, [str, num, bool, nul, array, obj]>,
		"<|",
		this["arg"]
	>;
}

type str = $<
	$<char<`"`>, "*>", many<notChar<`"`>>, "<*", char<`"`>>,
	">>|",
	Str.fromList
>;

type num = $<
	num.mantissa,
	"<&>",
	optional<$<num.exponent, ">>|", $<10, "||>", Num.pow>>, 1>,
	">>|",
	Num.multiply
>;
declare namespace num {
	type mantissa = $<
		$<optional<char<"-">, "">, "<&>", digits, ">>|", List.cons>,
		"<&>",
		optional<$<char<".">, "<&>", digits, ">>|", List.cons>, []>,
		">>|",
		$<List.concat, ">>", Str.fromList, ">>", Num.fromStr>
	>;
	type exponent = $<
		char<"e" | "E">,
		"*>",
		$<
			optional<$<char<"+">, "*>", pure<"">, "<|>", char<"-">>, "">,
			"<&>",
			digits
		>,
		">>|",
		$<List.cons, ">>", Str.fromList, ">>", Num.fromStr>
	>;
}

type bool = $<literal<"true">, "<|>", literal<"false">, ">>|", bool.fromStr>;
declare namespace bool {
	interface fromStr extends Fn<string, boolean> {
		return: this["arg"] extends "true" ? true : false;
	}
}

type nul = $<literal<"null">, ">>|", Fn.constant<null>>;

type array = $<
	charTok<"[">,
	"*>",
	optional<sequence<value>, []>,
	"<*",
	charTok<"]">
>;

type obj = $<
	charTok<"{">,
	"*>",
	optional<$<sequence<obj.kv>, ">>|", obj.fromList>, {}>,
	"<*",
	charTok<"}">
>;
declare namespace obj {
	type kv = $<str, "<&>", $<charTok<":">, "*>", value>>;
	interface fromList extends Fn {
		return: this["arg"] extends infer kvPairs extends [string, unknown][]
			? { [k in kvPairs[number][0]]: Extract<kvPairs[number], [k, unknown]>[1] }
			: never;
	}
}

/* Helpers */

type token<p extends Parser> = $<spaces, "*>", p, "<*", spaces>;
type charTok<c extends string> = token<char<c>>;

type sequence<p extends Parser> = $<
	$<p, "<&>", many<$<charTok<",">, "*>", p>>>,
	">>|",
	List.cons
>;
