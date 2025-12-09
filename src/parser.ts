import { Token } from "./lexer";
import { CommandNode, Program } from "./ast";
import { ExprNode } from "./ast";


export function parse(tokens: Token[]): Program {
  const result = parseBlock(tokens, 0);
  return { type: "Program", body: result.commands };
}





function parsePrimary(token: Token): ExprNode {
  if (token.type === "NUMBER") {
    return { type: "Number", value: Number(token.value) };
  }
  if (token.type === "IDENT") {
    return { type: "Var", name: token.value };
  }
  throw new Error("Unexpected token in expression: " + token.value);
}

function parseExpression(tokens: Token[], i: number) {
  let left = parsePrimary(tokens[i]);
  i++;

  // Parse: a + b - c + 1
  while (tokens[i] && (tokens[i].value === "+" || tokens[i].value === "-")) {
    const op = tokens[i].value as "+" | "-";
    const right = parsePrimary(tokens[i + 1]);

    left = {
      type: "Binary",
      op,
      left,
      right
    };

    i += 2;
  }

  return { node: left, index: i };
}




//
// Parse a block, starting at index i
//
function parseBlock(
  tokens: Token[],
  i: number
): { commands: CommandNode[]; index: number } {
  const commands: CommandNode[] = [];

  // Skip leading '{'
  if (tokens[i]?.value === "{") i++;
  

  while (i < tokens.length) {
    const t = tokens[i];

    // ===============================
    // End of block
    // ===============================
    if (t.value === "}") {
      return { commands, index: i };
    }
// Ignore standalone parentheses
if (t.type === "PAREN") {
    i++;
    continue;
}

    
    // ===============================
    // VAR DECL — int x = 5
    // ===============================
    if (t.value === "int" || t.value === "string") {
    const varType = t.value as "int" | "string";
    const name = tokens[i + 1].value;

    if (tokens[i + 2]?.value !== "=")
        throw new Error("Expected '=' in variable declaration");

    const valueToken = tokens[i + 3];

    let value: any;

    // ===========================
    // Case 1: int x = 5
    // ===========================
    if (valueToken.type === "NUMBER") {
    value = { type: "Number", value: Number(valueToken.value) };
    i += 4;
}


    // ===========================
    // Case 2: int x = y
    // ===========================
    else if (valueToken.type === "IDENT" && tokens[i + 4]?.type !== "PLUS") {
    value = { type: "Var", name: valueToken.value };
    i += 4;
}


    // ===========================
    // Case 3: int x = y + 1
    // ===========================
    else if (valueToken.type === "IDENT" && tokens[i + 4]?.value === "+") {
    const leftName = valueToken.value;
    const rightValue = Number(tokens[i + 5].value);

    value = {
        type: "Binary",
        op: "+",
        left: { type: "Var", name: leftName },
        right: { type: "Number", value: rightValue }
    };

    i += 6;
}


    else {
        throw new Error("Invalid variable assignment at token: " + valueToken.value);
    }

    commands.push({
        type: "VarDecl",
        varType,
        name,
        value
    });

    continue;
}


// ASSIGNMENT
// score = score + 1
// ===============================
if (t.type === "IDENT" && tokens[i + 1]?.value === "=") {
    const varName = t.value;

    i += 2;

    const exprRes = parseExpression(tokens, i);

    i = exprRes.index; // STOP HERE — expression already consumed
console.log("TOKENS:", tokens.slice(i, i+5));

    commands.push({
        type: "Assign",
        name: varName,
        value: exprRes.node
    });

    continue;
}



    // ===============================
    // IF STATEMENT
    // if a < b { ... } else { ... }
    // ===============================
    if (t.value === "if") {
      const leftToken = tokens[i + 1];
      const opToken = tokens[i + 2];
      const rightToken = tokens[i + 3];

      const left =
        leftToken.type === "NUMBER"
          ? Number(leftToken.value)
          : leftToken.value;

      const right =
        rightToken.type === "NUMBER"
          ? Number(rightToken.value)
          : rightToken.value;

      const opMap: any = {
        LT: "LT",
        GT: "GT",
        EQEQ: "EQEQ",
        NOTEQ: "NOTEQ"
      };

      const op = opMap[opToken.type];
      if (!op) throw new Error("Invalid operator in IF: " + opToken.value);

      // Parse THEN block
      const thenBlock = parseBlock(tokens, i + 5);
      let nextIndex = thenBlock.index + 1;

      // Parse optional ELSE
      let elseBody: CommandNode[] | null = null;
      if (tokens[nextIndex]?.value === "else") {
        const elseBlock = parseBlock(tokens, nextIndex + 2);
        elseBody = elseBlock.commands;
        nextIndex = elseBlock.index + 1;
      }

      commands.push({
        type: "If",
        condition: { left, op, right },
        thenBody: thenBlock.commands,
        elseBody
      });

      i = nextIndex;
      continue;
    }


        // ---------------------------
    // WHILE LOOP
    // while <left> <op> <right> { ... }
    // ---------------------------
    if (t.value === "while") {

      const leftToken  = tokens[i + 1];
      const opToken    = tokens[i + 2];
      const rightToken = tokens[i + 3];

      const left  = leftToken.type === "NUMBER" ? Number(leftToken.value) : leftToken.value;
      const right = rightToken.type === "NUMBER" ? Number(rightToken.value) : rightToken.value;

      let op: "LT" | "GT" | "EQEQ" | "NOTEQ";
      switch (opToken.type) {
        case "LT": op = "LT"; break;
        case "GT": op = "GT"; break;
        case "EQEQ": op = "EQEQ"; break;
        case "NOTEQ": op = "NOTEQ"; break;
        default:
          throw new Error("Invalid operator in WHILE: " + opToken.value);
      }

      if (tokens[i + 4]?.value !== "{")
        throw new Error("Expected '{' after while condition");

      const block = parseBlock(tokens, i + 5);

      commands.push({
        type: "While",
        condition: { left, op, right },
        body: block.commands
      });

      i = block.index + 1;
      continue;
    }


    // ===============================
    // MOVE TO
    // move obstacle to X Y speed N
    // ===============================
    if (t.value === "move" && tokens[i + 2]?.value === "to") {
      const name = tokens[i + 1].value;

      const xTok = tokens[i + 3];
      const yTok = tokens[i + 4];

      const x =
        xTok.type === "NUMBER" ? Number(xTok.value) : xTok.value;

      const y =
        yTok.type === "NUMBER" ? Number(yTok.value) : yTok.value;

      let speed = 1;
      let advance = 5;

      if (tokens[i + 5]?.value === "speed") {
        speed = Number(tokens[i + 6].value);
        advance = 7;
      }

      commands.push({
        type: "MoveTo",
        name,
        x,
        y,
        speed
      });

      i += advance;
      continue;
    }

    // ===============================
    // MOVE (relative)
    // move enemy 10 0 speed 2
    // ===============================
    if (t.value === "move") {
      const name = tokens[i + 1].value;

      const dxTok = tokens[i + 2];
      const dyTok = tokens[i + 3];

      const dx =
        dxTok.type === "NUMBER" ? Number(dxTok.value) : dxTok.value;

      const dy =
        dyTok.type === "NUMBER" ? Number(dyTok.value) : dyTok.value;

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

    // ===============================
    // REPEAT — repeat x times { ... }
    // ===============================
   if (t.value === "repeat") {
    const cntTok = tokens[i + 1];

    const count =
        cntTok.type === "NUMBER"
            ? Number(cntTok.value)
            : cntTok.value;

    if (tokens[i + 2]?.value !== "times")
        throw new Error("Expected 'times' after repeat");

    if (tokens[i + 3]?.value !== "{")
        throw new Error("Expected '{' after repeat N times");

    // Parse the inner block STARTING AT "{"
    const inner = parseBlock(tokens, i + 3);

    commands.push({
        type: "Repeat",
        count,
        body: inner.commands
    });

    // ⬅️ FIX: move index to AFTER the closing "}"
    i = inner.index + 1;

    continue;  // ⬅️ REQUIRED! Do not fall through.
}


    // ===============================
    // SPAWN
    // spawn obstacle 100 100 red
    // ===============================
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

    // ===============================
    // CONTROL
    // control player with arrows
    // ===============================
    if (t.value === "control") {
      commands.push({
        type: "Control",
        name: tokens[i + 1].value,
        scheme: tokens[i + 3].value
      });

      i += 4;
      continue;
    }
        // ----------------------------------------
    // FUNCTION DECLARATION
    // func name { ... }
    // ----------------------------------------
    // ─────────────────────────────
// FUNCTION DECLARATION
// func name() { ... }
// ─────────────────────────────
if (t.value === "func") {
  const name = tokens[i + 1].value;

  // Expect "("
  if (tokens[i + 2].value !== "(") {
    throw new Error("Expected '(' after function name");
  }

  // PARAMETERS (not yet implemented — empty for now)
  const params: string[] = [];

  // Find ")"
  let j = i + 3;
  while (tokens[j].value !== ")") {
    // Later you can parse real parameters here
    j++;
  }

  // Expect "{"
  if (tokens[j + 1].value !== "{") {
    throw new Error("Expected '{' after function parameter list");
  }

  // Parse body
  const bodyBlock = parseBlock(tokens, j + 2);

  commands.push({
    type: "FuncDecl",
    name,
    params,               // REQUIRED
    body: bodyBlock.commands
  });

  i = bodyBlock.index + 1;
  continue;
}

        // ─────────────────────────────
    // CALL functionName
    // ─────────────────────────────
    if (t.value === "call") {
      const name = tokens[i + 1].value;

      commands.push({
        type: "Call",
        name,
        args: []  // no params yet
      });

      i += 2;
      continue;
    }

    // UI text command: ui <text> <x> <y> <color> <size>
if (t.value === "ui") {
    const textToken = tokens[i + 1];

    const text = textToken.value;
    const x = Number(tokens[i + 2].value);
    const y = Number(tokens[i + 3].value);
    const color = tokens[i + 4]?.value ?? "white";
    const size = Number(tokens[i + 5]?.value ?? 20);

    const isVar = textToken.type === "IDENT";

    commands.push({
        type: "UI",
        text,
        x,
        y,
        color,
        size,
        isVar
    });

    i += 6;
    continue;
}




// ONUPDATE: triggers every frame
if (t.value === "onupdate") {
    if (tokens[i + 1]?.value !== "{")
        throw new Error("Expected '{' after onupdate");

    const block = parseBlock(tokens, i + 2);

    commands.push({
        type: "OnUpdate",
        body: block.commands
    });

    i = block.index + 1; // move past '}'
    continue;
}

if (t.value === "oncollision") {
    const name = tokens[i+1].value;

    if (tokens[i+2].value !== "{")
        throw new Error("Expected '{' after oncollision");

    const block = parseBlock(tokens, i+2);

    commands.push({
        type: "OnCollision",
        name,
        body: block.commands
    });

    i = block.index + 1;
    continue;
}




    // UNKNOWN COMMAND
    console.warn("Unknown command:", t);
    i++;
  }

  return { commands, index: i };
}
