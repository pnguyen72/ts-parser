import type { calculate } from "./lib/calculator";

type _calculator =
	calculate<"-(-4(7-1) - 2*-3 + 1.9) + -2/3.2(2+-9) * --4(+11/2*+5)">;
