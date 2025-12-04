import { Token } from "./lexer";
import { Program, CommandNode } from "./ast";

export function parse(tokens: Token[]): Program {
  const result = parseBlock(tokens, 0);
  return { type: "Program", body: result.commands };
}

function parseBlock(tokens: Token[], i: number): { commands: CommandNode[], index: number } {
  const commands: CommandNode[] = [];

  // Skip leading {
  if (tokens[i]?.value === "{") i++;

  while (i < tokens.length) {
    const t = tokens[i];

    // END BLOCK
    if (t.value === "}") {
      return { commands, index: i };
    }

    // --------------------------------------------------
    // IF STATEMENT
    // --------------------------------------------------
    if (t.value === "if") {
      const leftToken = tokens[i + 1];
      const opToken = tokens[i + 2];
      const rightToken = tokens[i + 3];

      const left =
        leftToken.type === "NUMBER" ? Number(leftToken.value) : leftToken.value;

      const right =
        rightToken.type === "NUMBER" ? Number(rightToken.value) : rightToken.value;

      const opMap: Record<string, any> = {
        LT: "LT",
        GT: "GT",
        EQEQ: "EQEQ",
        NOTEQ: "NOTEQ",
      };

      const op = opMap[opToken.type];
      if (!op) throw new Error("Invalid IF operator: " + opToken.value);

      // Expect "{"
      if (tokens[i + 4]?.value !== "{")
        throw new Error("Expected '{' after IF condition");

      const thenBlock = parseBlock(tokens, i + 4);
      let cursor = thenBlock.index + 1;

      let elseBody: CommandNode[] | null = null;
      if (tokens[cursor]?.value === "else") {
        if (tokens[cursor + 1]?.value !== "{")
          throw new Error("Expected '{' after ELSE");

        const elseBlock = parseBlock(tokens, cursor + 1);
        elseBody = elseBlock.commands;
        i = elseBlock.index + 1;
      } else {
        i = cursor;
      }

      commands.push({
        type: "If",
        condition: { left, op, right },
        thenBody: thenBlock.commands,
        elseBody
      });

      continue;
    }

    // --------------------------------------------------
    // MOVE TO — move name to X Y [speed N]
    // --------------------------------------------------
    if (t.value === "move" && tokens[i + 2]?.value === "to") {
      const name = tokens[i + 1].value;

      const xToken = tokens[i + 3];
      const yToken = tokens[i + 4];

      const x = xToken.type === "NUMBER" ? Number(xToken.value) : xToken.value;
      const y = yToken.type === "NUMBER" ? Number(yToken.value) : yToken.value;

      let speed = 1;
      let advance = 5;

      if (tokens[i + 5]?.value === "speed") {
        speed = Number(tokens[i + 6].value);
        advance = 7;
      }

      commands.push({ type: "MoveTo", name, x, y, speed });
      i += advance;
      continue;
    }

    // --------------------------------------------------
    // MOVE — move name dx dy [speed N]
    // --------------------------------------------------
    if (t.value === "move") {
      const name = tokens[i + 1].value;
      const dxTok = tokens[i + 2];
      const dyTok = tokens[i + 3];

      const dx = dxTok.type === "NUMBER" ? Number(dxTok.value) : dxTok.value;
      const dy = dyTok.type === "NUMBER" ? Number(dyTok.value) : dyTok.value;

      let speed = 1;
      let advance = 4;

      if (tokens[i + 4]?.value === "speed") {
        speed = Number(tokens[i + 5].value);
        advance = 6;
      }

      commands.push({ type: "Move", name, dx, dy, speed });
      i += advance;
      continue;
    }

    // --------------------------------------------------
    // VAR DECL (int)
    // --------------------------------------------------
    if (t.value === "int") {
      const name = tokens[i + 1].value;

      if (tokens[i + 2]?.value !== "=")
        throw new Error("Expected '=' in int declaration");

      const value = Number(tokens[i + 3].value);
      commands.push({ type: "VarDecl", varType: "int", name, value });
      i += 4;
      continue;
    }

    // --------------------------------------------------
    // VAR DECL (string)
    // --------------------------------------------------
    if (t.value === "string") {
      const name = tokens[i + 1].value;

      if (tokens[i + 2]?.value !== "=")
        throw new Error("Expected '=' in string declaration");

      const valTok = tokens[i + 3];

      commands.push({
        type: "VarDecl",
        varType: "string",
        name,
        value: valTok.value
      });

      i += 4;
      continue;
    }

    // --------------------------------------------------
    // SPAWN
    // --------------------------------------------------
    if (t.value === "spawn") {
      commands.push({
        type: "Spawn",
        name: tokens[i + 1].value,
        x: Number(tokens[i + 2].value),
        y: Number(tokens[i + 3].value),
        color: tokens[i + 4]?.value ?? "gray"
      });
      i += 5;
      continue;
    }

    // --------------------------------------------------
    // CONTROL
    // --------------------------------------------------
    if (t.value === "control") {
      commands.push({
        type: "Control",
        name: tokens[i + 1].value,
        scheme: tokens[i + 3].value
      });
      i += 4;
      continue;
    }

    // --------------------------------------------------
    // REPEAT
    // --------------------------------------------------
    // --------------------------------------------------
// REPEAT
// --------------------------------------------------
if (t.value === "repeat") {
  const countToken = tokens[i + 1];

  const count =
    countToken.type === "NUMBER"
      ? Number(countToken.value)
      : countToken.value; // support variable names

  if (tokens[i + 2]?.value !== "times")
    throw new Error("Expected 'times' after repeat");

  if (tokens[i + 3]?.value !== "{")
    throw new Error("Expected '{' after repeat");

  // FIX HERE → start after the '{'
  const block = parseBlock(tokens, i + 4);

  commands.push({
    type: "Repeat",
    count,
    body: block.commands
  });

  // move index past closing '}'
  i = block.index + 1;
  continue;
}



    console.warn("Unknown command:", t);
    i++;
  }

  return { commands, index: i };
}
