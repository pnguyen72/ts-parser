import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";
import type * as Num from "./helpers/number";

/* Parser type */

export type Success<T = unknown, remaining extends string = string> = {
	result: T;
	remaining: remaining;
};
export type Failure<message = unknown> = { error: message };
export type Parser = Fn<string, Success | Failure>;

export interface success extends Fn<unknown, Parser> {
	return: success.impl<this["arg"]>;
}
export declare namespace success {
	interface impl<T> extends Parser {
		return: Success<T, this["arg"]>;
	}
}
export interface fail<err extends string> extends Parser {
	return: Failure<err>;
}

export type parse<p extends Parser, input extends string> =
	$<p, "<|", input> extends infer res
		? res extends Success<infer T, infer remaining>
			? remaining extends ""
				? T
				: Failure<[T, `Discarded ${remaining}`]>
			: res
		: never;

/* Combinators */

declare global {
	interface InfixOperators {
		">>=": bind;
		">>|": map;
		"->": keepRight;
		"<-": keepLeft;
		"||": choice;
		"&&": both;
	}
}

export interface bind extends Fn<[Parser, Fn<unknown, Parser>]> {
	return: bind.impl<this["arg"][0], this["arg"][1]>;
}
declare namespace bind {
	interface impl<p extends Parser, f extends Fn<unknown, Parser>>
		extends Parser {
		return: $<p, "<|", this["arg"]> extends infer res
			? res extends Success<infer T, infer remaining>
				? $<f, "<|", T, "<|", remaining>
				: res
			: never;
	}
}

export interface both extends Fn<[Parser, Parser]> {
	return: map2<this["arg"][0], this["arg"][1], both.pair>;
}
declare namespace both {
	interface pair extends Fn<[unknown, unknown]> {
		return: [this["arg"][0], this["arg"][1]];
	}
}

export interface map extends Fn<[Parser, Fn]> {
	return: $<this["arg"][0], ">>=", $<this["arg"][1], ">>", success>>;
}

export type map2<
	p1 extends Parser,
	p2 extends Parser,
	f extends Fn<[unknown, unknown]>,
> = $<p1, ">>=", map2.aux<p2, f>>;
declare namespace map2 {
	interface aux<p2 extends Parser, f extends Fn<[unknown, unknown]>>
		extends Fn<unknown, Parser> {
		return: $<p2, ">>=", $<this["arg"], "||>", f, ">>", success>>;
	}
}

export interface keepRight extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", Fn.constant<this["arg"][1]>>;
}

export interface keepLeft extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", keepLeft.aux<this["arg"][1]>>;
}
declare namespace keepLeft {
	interface aux<other extends Parser> extends Fn<unknown, Parser> {
		return: $<other, "->", $<this["arg"], "|>", success>>;
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

/* Basic parsers */

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
			? res extends Success<infer T, infer remaining>
				? impl<p, remaining, [...acc, T]>
				: Success<acc, input>
			: never;
}

export type many1<p extends Parser> = $<p, ">>=", many1.aux<p>>;
declare namespace many1 {
	interface aux<p extends Parser> extends Fn<unknown, Parser> {
		return: $<many<p>, ">>=", $<this["arg"], "||>", List.cons, ">>", success>>;
	}
}

export type spaces = $<
	many<$<str<" ">, "||", str<"\t">, "||", str<"\n">>>,
	">>|",
	Fn.constant<never>
>;

export interface str<s extends string> extends Parser {
	return: this["arg"] extends `${infer matched extends s}${infer remaining}`
		? Success<matched, remaining>
		: Failure<`Expected ${s}`>;
}

export type num = $<
	many1<str<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9">>,
	">>|",
	$<List.join, ">>", Num.fromStr>
>;
