import assert from "node:assert/strict";
import { sfSymbolExports } from "#src/icons/apple-symbol-exports.ts";

const token = /[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi;
const arity = { M: 2, L: 2, C: 6, Z: 0 };

for (const [name, symbol] of Object.entries(sfSymbolExports)) {
  for (const dimension of [symbol.w, symbol.h, symbol.units]) {
    assert(Number.isFinite(dimension) && dimension > 0, `${name}: invalid dimension`);
  }
  assert(symbol.opacity >= 0 && symbol.opacity <= 1, `${name}: invalid opacity`);
  assert(symbol.paths.length > 0, `${name}: no paths`);
  for (const d of symbol.paths) {
    assert(
      d.startsWith("M") && d.endsWith("Z"),
      `${name}: path must start with M and close with Z`,
    );
    assert(d.replace(token, "").trim() === "", `${name}: unexpected path text`);
    const tokens = d.match(token);
    let command;
    let count = 0;
    const complete = () => {
      if (!command) return;
      assert(
        arity[command] === 0 ? count === 0 : count > 0 && count % arity[command] === 0,
        `${name}: invalid ${command} coordinates`,
      );
    };
    for (const value of tokens) {
      if (value in arity) {
        complete();
        command = value;
        count = 0;
      } else {
        assert(command && Number.isFinite(Number(value)), `${name}: invalid coordinate`);
        count++;
      }
    }
    complete();
  }
}

console.log(
  `Validated ${Object.keys(sfSymbolExports).length} supplied Apple exports: dimensions, opacity and complete SVG path commands.`,
);
