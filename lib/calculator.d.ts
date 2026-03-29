import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";
import type { parse as _parse, many, num, Parser, spaces, str } from "./parser";

export type parse<input extends string> = _parse<expr, input>;

type numTok = $<num, "<*", spaces>;
type strTok<s extends string> = $<str<s>, "<*", spaces>;

interface group extends Parser {
	return: Fn.call<$<strTok<"(">, "*>", expr, "<*", strTok<")">>, this["arg"]>;
}

type factor = $<numTok, "<|>", group>;

type term = $<factor, ">>=", term.loop>;
declare namespace term {
	interface loop extends Fn<number, Parser> {
		return: $<
			many<$<strTok<"*">, "*>", factor, "<|>", group>>,
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
					$<strTok<"+">, "*>", term, ">>|", add>,
					"<|>",
					$<strTok<"-">, "*>", term, ">>|", subtract>
				>
			>,
			">>|",
			List.fold<Fn.revApply, this["arg"]>
		>;
	}
	type add = Fn.curry<Num.add>;
	type subtract = Fn.curry<Fn.flip<Num.subtract>>;
}
