import type { evaluate } from "./lib/calculator";

type _test = evaluate<"-(-4(10-6+1) - 2*-3 + 9)/-7(1-4) + -20 * --4(+11-2*+5)">;
