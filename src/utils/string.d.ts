import type { List } from ".";
import type { Fn } from "./function";

export interface concat extends Fn<[string, string]> {
	return: `${this["arg"][0]}${this["arg"][1]}`;
}

export interface fromList extends Fn {
	return: List.foldLeft<concat, "", this["arg"]>;
}
