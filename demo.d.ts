import type { evaluate } from "./lib/calculator";

type _test = evaluate<"-(-4(9-6+1) - 2*3 + 10)(-6) + -20 * -4(+11-2*5)">;
