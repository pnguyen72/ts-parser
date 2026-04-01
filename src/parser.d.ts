import type { $, Fn, List, Str } from "./utils/";

export type parse<p extends Parser, input extends string> =
	$<p, "<|", input> extends infer res
		? res extends Success<infer result, infer remaining>
			? remaining extends ""
				? result
				: Failure<[result, `Discarded ${remaining}`]>
			: res
		: never;

/* Parser monad definition */

// Passing _T into Success causes wrong type inference.
// But just keep it to allow type annotation for readability
export type Parser<_T = unknown> = Fn<string, Success | Failure>;
type Success<result = unknown, remaining extends string = string> = {
	result: result;
	remaining: remaining;
};
type Failure<error = unknown> = { error: error };

export type pure<result = never> = [result] extends [never]
	? pure.fn
	: pure.impl<result>;
declare namespace pure {
	interface impl<result> extends Parser {
		return: Success<result, this["arg"]>;
	}
	interface fn extends Fn<unknown, Parser> {
		return: impl<this["arg"]>;
	}
}

export interface fail<error> extends Parser {
	return: Failure<error>;
}

export interface bind extends Fn<[Parser, Fn<unknown, Parser>]> {
	return: bind.impl<this["arg"][0], this["arg"][1]>;
}
declare namespace bind {
	interface impl<p extends Parser, f extends Fn<unknown, Parser>>
		extends Parser {
		return: $<p, "<|", this["arg"]> extends infer res
			? res extends Success<infer result, infer remaining>
				? $<f, "<|", result, "<|", remaining>
				: res
			: never;
	}
}

/* Combinators */

declare global {
	interface InfixOperators {
		">>=": bind;
		">>|": map;
		"*>": keepRight;
		"<*": keepLeft;
		"<|>": choice;
		"<&>": both;
	}
}

export interface map extends Fn<[Parser, Fn]> {
	return: $<this["arg"][0], ">>=", $<this["arg"][1], ">>", pure>>;
}

export interface keepRight extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", Fn.constant<this["arg"][1]>>;
}

export interface keepLeft extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", keepLeft.aux<this["arg"][1]>>;
}
declare namespace keepLeft {
	interface aux<discarded extends Parser> extends Fn<unknown, Parser> {
		return: $<discarded, "*>", pure<this["arg"]>>;
	}
}

export interface choice extends Fn<[Parser, Parser]> {
	return: choice.impl<this["arg"][0], this["arg"][1]>;
}
declare namespace choice {
	interface impl<p1 extends Parser, p2 extends Parser> extends Parser {
		return: $<p1, "<|", this["arg"]> extends infer res1
			? res1 extends Success
				? res1
				: $<p2, "<|", this["arg"]> extends infer res2
					? res2 extends Success
						? res2
						: Failure<
								| (res1 extends Failure<infer e1> ? e1 : never)
								| (res2 extends Failure<infer e2> ? e2 : never)
							>
					: never
			: never;
	}
}

export interface both extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", both.aux<this["arg"][1]>>;
}
declare namespace both {
	interface aux<p2 extends Parser> extends Fn<unknown, Parser> {
		return: $<p2, ">>=", $<this["arg"], "|>", pair, ">>", pure>>;
	}
	// @ts-expect-error: curry expects Fn<[unknown, unknown]>, but id can be of any type
	type pair = Fn.curry<Fn.id>;
}

export type optional<p extends Parser, _default> = $<p, "<|>", pure<_default>>;

export interface many<p extends Parser> extends Parser {
	return: many.impl<p, this["arg"]>;
}
declare namespace many {
	type impl<
		p extends Parser,
		input extends string,
		acc extends unknown[] = [],
	> =
		$<p, "<|", input> extends infer res
			? res extends Success<infer result, infer remaining>
				? impl<p, remaining, [...acc, result]>
				: Success<acc, input>
			: never;
}

export type many1<p extends Parser> = $<p, ">>=", many1.aux<p>>;
declare namespace many1 {
	interface aux<p extends Parser> extends Fn<unknown, Parser> {
		return: $<many<p>, ">>=", $<this["arg"], "||>", List.cons, ">>", pure>>;
	}
}

/* Basic parsers */

export interface char<c extends string> extends Parser {
	return: this["arg"] extends `${infer matched extends c}${infer remaining}`
		? Success<matched, remaining>
		: Failure<`Expected ${c}`>;
}

export interface notChar<c extends string> extends Parser {
	return: this["arg"] extends `${infer head}${infer tail}`
		? head extends c
			? Failure<`Invalid input: ${c}`>
			: Success<head, tail>
		: Failure<"Unexpected end of input">;
}

export type literal<
	s extends string,
	acc extends Parser = pure<"">,
> = s extends `${infer head}${infer tail}`
	? literal<tail, $<acc, "<&>", char<head>, ">>|", Str.concat>>
	: acc;

export type spaces = many<$<char<" ">, "<|>", char<"\t">, "<|>", char<"\n">>>;

export type digits = many1<
	char<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9">
>;
