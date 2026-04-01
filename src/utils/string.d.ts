import type { Fn } from "./function";
import type * as List from "./list";

export interface concat extends Fn<[string, string]> {
	return: `${this["arg"][0]}${this["arg"][1]}`;
}

export interface fromList extends Fn {
	return: List.foldLeft<concat, "", this["arg"]>;
}
