export interface Token {
  type: string;
  value: string;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let current = "";

  function pushWord() {
    if (current.length > 0) {
      tokens.push({
        type: isNaN(Number(current)) ? "WORD" : "NUMBER",
        value: current,
      });
      current = "";
    }
  }

  for (const char of source) {
    if (/\s/.test(char)) {
      pushWord();
    } else if (char === "{" || char === "}") {
      pushWord();
      tokens.push({ type: "BRACE", value: char });
    } else {
      current += char;
    }
  }
  pushWord();

  return tokens;
}
