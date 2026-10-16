// A tiny highlighter for the Code tab: enough colour to read, no dependency.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rules: [RegExp, string][] = [
  [/\/\/[^\n]*/y, "c"],
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y, "s"],
  [/<\/?[A-Za-z][\w.:-]*/y, "t"],
  [/\b(?:import|from|export|const|let|type|as|of|each|if|else|true|false|null|new|return|function)\b/y, "k"],
  [/\b\d[\d_.]*\b/y, "n"],
];

export function highlight(code: string): string {
  let out = "";
  let i = 0;
  while (i < code.length) {
    let hit = false;
    for (const [re, cls] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m) {
        out += `<span class="tok-${cls}">${esc(m[0])}</span>`;
        i += m[0].length;
        hit = true;
        break;
      }
    }
    if (!hit) {
      out += esc(code[i]);
      i++;
    }
  }
  return out;
}
