import type { $, Fn, List, Num, Str } from "./helpers";
import type {
	char,
	choice,
	fail,
	literal,
	many,
	many1,
	notChar,
	optional,
	Parser,
	parse as parse_,
	pure,
	spaces,
} from "./parser";

export type parse<s extends string> = parse_<token<value>, s>;

type token<p extends Parser> = $<spaces, "*>", p, "<*", spaces>;
type charTok<c extends string> = token<char<c>>;

interface value extends Parser {
	return: $<
		List.foldLeft<choice, fail<"Empty">, [str, num, bool, nul, array, obj]>,
		"<|",
		this["arg"]
	>;
}

type str = $<
	$<char<`"`>, "*>", many<notChar<`"`>>, "<*", char<`"`>>,
	">>|",
	Str.fromList
>;

type num = $<$<num.base, "<&>", num.power>, ">>|", num.applyPower>;
declare namespace num {
	type digits = many1<
		char<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9">
	>;
	type base = $<
		$<optional<char<"-">, "">, "<&>", digits, ">>|", List.cons>,
		"<&>",
		optional<$<char<".">, "<&>", digits, ">>|", List.cons>, []>,
		">>|",
		$<List.concat, ">>", Str.fromList, ">>", Num.fromStr>
	>;
	type power = optional<
		$<
			char<"e" | "E">,
			"*>",
			$<
				optional<$<char<"+">, "*>", pure<"">, "<|>", char<"-">>, "">,
				"<&>",
				digits
			>,
			">>|",
			$<List.cons, ">>", Str.fromList, ">>", Num.fromStr>
		>,
		0
	>;
	interface applyPower extends Fn<[number, number]> {
		return: $<10, "^", this["arg"][1], "*", this["arg"][0]>;
	}
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
	many<$<value, "<*", charTok<",">, "<|>", value>>,
	"<*",
	charTok<"]">
>;

type obj = $<
	charTok<"{">,
	"*>",
	$<many<$<obj.kv, "<*", charTok<",">, "<|>", obj.kv>>, ">>|", obj.fromList>,
	"<*",
	charTok<"}">
>;
declare namespace obj {
	type kv = $<str, "<*", charTok<":">, "<&>", value>;
	interface fromList extends Fn {
		return: this["arg"] extends infer kvPairs extends [string, unknown][]
			? { [k in kvPairs[number][0]]: Extract<kvPairs[number], [k, unknown]>[1] }
			: never;
	}
}
