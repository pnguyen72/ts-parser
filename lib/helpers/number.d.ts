import type { Add, Multiply, Subtract } from "ts-arithmetic";
import type { Fn } from "./function";

export interface fromStr extends Fn<string, number> {
	return: this["arg"] extends `${infer n extends number}` ? n : never;
}

declare global {
	interface infixOperators {
		"+": add;
		"-": subtract;
		"*": multiply;
	}
}

export interface add extends Fn<[number, number], number> {
	return: Add<this["arg"][0], this["arg"][1]>;
}

export interface subtract extends Fn<[number, number], number> {
	return: Subtract<this["arg"][0], this["arg"][1]>;
}

export interface multiply extends Fn<[number, number], number> {
	return: Multiply<this["arg"][0], this["arg"][1]>;
}
