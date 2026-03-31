import type { $, Fn } from "./helpers/function";
import type * as List from "./helpers/list";

/* Parser type */

type Success<T = unknown, remaining extends string = string> = {
	result: T;
	remaining: remaining;
};
type Failure<message = unknown> = { error: message };

export type Parser = Fn<string, Success | Failure>;

export type parse<p extends Parser, input extends string> =
	$<p, "<|", input> extends infer res
		? res extends Success<infer T, infer remaining>
			? remaining extends ""
				? T
				: Failure<[T, `Discarded ${remaining}`]>
			: res
		: never;

/* Monadic operations */

declare global {
	interface InfixOperators {
		">>=": bind;
		">>|": map;
		"->": keepRight;
		"<-": keepLeft;
		"<|>": choice;
		"<&>": both;
	}
}

export interface success extends Fn<unknown, Parser> {
	return: success.impl<this["arg"]>;
}
export declare namespace success {
	interface impl<T> extends Parser {
		return: Success<T, this["arg"]>;
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

export interface map extends Fn<[Parser, Fn]> {
	return: $<this["arg"][0], ">>=", $<this["arg"][1], ">>", success>>;
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

export interface both extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", both.aux<this["arg"][1]>>;
}
declare namespace both {
	interface aux<p2 extends Parser> extends Fn<unknown, Parser> {
		return: $<p2, ">>=", $<this["arg"], "|>", pair, ">>", success>>;
	}
	type pair = Fn.curry<Fn.id<[unknown, unknown]>>;
}

/* Basic parsers */

export type maybe<p extends Parser, defaultValue> = $<
	p,
	"<|>",
	$<success, "<|", defaultValue>
>;

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
	many<$<char<" ">, "<|>", char<"\t">, "<|>", char<"\n">>>,
	">>|",
	Fn.constant<never>
>;

export interface char<s extends string> extends Parser {
	return: this["arg"] extends `${infer matched extends s}${infer remaining}`
		? Success<matched, remaining>
		: Failure<`Expected ${s}`>;
}
