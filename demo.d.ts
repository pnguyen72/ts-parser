import type { parse } from "./lib/calculator";

type _test = parse<"3(4(9-6+1) - 2*3) + 2(2*5)">;
