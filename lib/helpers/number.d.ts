import type { Fn } from "./function";

export interface fromStr extends Fn<string, number> {
	return: this["arg"] extends `${infer n extends number}` ? n : never;
}
