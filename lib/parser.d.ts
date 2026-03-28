import type { $, Fn } from "./helpers/function.d.ts";
import type * as List from "./helpers/list.d.ts";
import type * as Num from "./helpers/number.d.ts";

/* Parser type */

export type Success<T = unknown, remaining extends string = string> = {
	result: T;
	remaining: remaining;
};
export type Failure<message extends string = string> = { error: message };
export type Parser = Fn<string, Success | Failure>;

export interface success<T> extends Parser {
	return: Success<T, this["arg"]>;
}
export declare namespace success {
	interface fn extends Fn<unknown, Parser> {
		return: success<this["arg"]>;
	}
}
export interface fail<e extends string> extends Parser {
	return: Failure<e>;
}

export type parse<p extends Parser, input extends string> =
	Fn.call<p, input> extends infer res
		? res extends Success<infer T>
			? T
			: res
		: never;

/* Combinators */

declare global {
	interface infixOperators {
		">>=": bind;
		">>|": lift;
		"*>": sequenceR;
		"<*": sequenceL;
		"<|>": choice;
	}
}

export interface bind extends Fn<[Parser, Fn<unknown, Parser>]> {
	return: bind.impl<this["arg"][0], this["arg"][1]>;
}
declare namespace bind {
	interface impl<p extends Parser, f extends Fn<unknown, Parser>>
		extends Parser {
		return: Fn.call<p, this["arg"]> extends infer res
			? res extends Success<infer T, infer remaining>
				? Fn.fold<f, [T, remaining]>
				: res
			: never;
	}
}

export interface lift extends Fn<[Parser, Fn]> {
	return: $<this["arg"][0], ">>=", Fn.compose<success.fn, this["arg"][1]>>;
}

export interface sequenceR extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", Fn.constant<this["arg"][1]>>;
}

export interface sequenceL extends Fn<[Parser, Parser]> {
	return: $<this["arg"][0], ">>=", sequenceL.aux<this["arg"][1]>>;
}
declare namespace sequenceL {
	interface aux<other extends Parser> extends Fn<unknown, Parser> {
		return: $<other, "*>", success<this["arg"]>>;
	}
}

export interface choice extends Fn<[Parser, Parser]> {
	return: choice.impl<this["arg"][0], this["arg"][1]>;
}
declare namespace choice {
	interface impl<p1 extends Parser, p2 extends Parser> extends Parser {
		return: Fn.call<p1, this["arg"]> extends infer s extends Success
			? s
			: Fn.call<p2, this["arg"]>;
	}
}

/* Basic parsers */

export interface advance extends Parser {
	return: this["arg"] extends `${infer c}${infer remaining}`
		? Success<c, remaining>
		: Failure<`Unexpected end of input`>;
}

export interface many<p extends Parser> extends Parser {
	return: many.impl<p, this["arg"]>;
}
declare namespace many {
	type impl<
		p extends Parser,
		input extends string,
		acc extends unknown[] = [],
	> =
		Fn.call<p, input> extends infer res
			? res extends Success<infer T, infer remaining>
				? impl<p, remaining, [...acc, T]>
				: Success<acc, input>
			: never;
}
export type many1<p extends Parser> = $<p, ">>=", many1.aux<p>>;
declare namespace many1 {
	interface aux<p extends Parser> extends Fn<unknown, Parser> {
		return: $<many<p>, ">>=", Fn.compose<success.fn, concat<this["arg"]>>>;
	}
	interface concat<head> extends Fn {
		return: this["arg"] extends infer tail extends unknown[]
			? [head, ...tail]
			: never;
	}
}

export type spaces = $<
	many<$<str<" ">, "<|>", str<"\t">, "<|>", str<"\n">>>,
	">>|",
	Fn.constant<never>
>;

export interface str<s extends string> extends Parser {
	return: this["arg"] extends `${s}${infer remaining}`
		? Success<s, remaining>
		: Failure<`Expected ${this["arg"]}`>;
}

export type num = $<
	many1<num.digit>,
	">>|",
	Fn.compose<Num.fromStr, List.join>
>;
declare namespace num {
	export type digit = $<advance, ">>=", isDigit>;
	interface isDigit extends Fn<string, Parser> {
		return: this["arg"] extends char
			? success<this["arg"]>
			: fail<`Expected digit, got ${this["arg"]}`>;
	}
	type char = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
}
