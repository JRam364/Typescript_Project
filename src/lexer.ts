export interface Token {
  type: string;
  value: string;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let current = "";
  let i = 0;

  function pushWord() {
    if (current.length > 0) {
      if (!isNaN(Number(current))) {
        tokens.push({ type: "NUMBER", value: current });
      } else {
        tokens.push({ type: "IDENT", value: current });
      }
      current = "";
    }
  }

  while (i < source.length) {
    const char = source[i];

    // WHITESPACE
    if (/\s/.test(char)) {
      pushWord();
      i++;
      continue;
    }

    // BRACES
    if (char === "{" || char === "}") {
      pushWord();
      tokens.push({ type: "BRACE", value: char });
      i++;
      continue;
    }

    if (source.startsWith("==", i)) {
    tokens.push({ type: "EQEQ", value: "==" });
}
if (source.startsWith("!=", i)) {
    tokens.push({ type: "NOTEQ", value: "!=" });
}
if (char === "<") {
    tokens.push({ type: "LT", value: "<" });
}
if (char === ">") {
    tokens.push({ type: "GT", value: ">" });
}


    // = (assignment)
    if (char === "=") {
      pushWord();
      tokens.push({ type: "EQUAL", value: "=" });
      i++;
      continue;
    }


    if (char === '"') {
    i++;
    let value = "";
    while (i < source.length && source[i] !== '"') {
        value += source[i++];
    }
    i++; // skip closing quote
    tokens.push({ type: "STRING", value });
    continue;
}

    // IDENTIFIER / NUMBER / player.x
    if (/[a-zA-Z0-9._]/.test(char)) {
      current += char;
      i++;
      continue;
    }

    // Unknown character → ignore or error
    i++;
  }

  pushWord();
  return tokens;
}
