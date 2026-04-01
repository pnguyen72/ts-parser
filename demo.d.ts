import type { calculate } from "./examples/arithmetic";
import type { parseJson } from "./examples/json";

type _arithmetic =
	calculate<"-(-4(7-1) - 2*-3 + 1.9) + -2/3.2(2+-9) * --4(+11/2*+5)">;

type _json = parseJson<`
{
	"name": "ts-parser",
	"description": "Type-level parser combinator",
	"license": "MIT",
	"keywords": [
		"parser",
		"combinator",
		"monadic",
		"type-level"
	],
	"devDependencies": {
		"@typescript/native-preview": "7.0.0-dev.20260330.1",
		"ts-arithmetic": "^0.1.1"
	}
}
`>;
