import { Token } from "./lexer";
import { Program, CommandNode } from "./ast";

// Entry point
export function parse(tokens: Token[]): Program {
  const result = parseBlock(tokens, 0);
  return {
    type: "Program",
    body: result.commands,
  };
}

/**
 * Parse a block of commands starting at index i.
 * Stops when it hits '}' or end of token list.
 */
function parseBlock(tokens: Token[], i: number): { commands: CommandNode[]; index: number } {
  const commands: CommandNode[] = [];

  while (i < tokens.length) {
    const t = tokens[i];

    // End of a {...} block
    if (t.value === "}") {
      return { commands, index: i };
    }

    // ─────────────────────────────
    // MOVE TO:  move name to X Y [speed N]
    // ─────────────────────────────
    if (t.value === "move" && tokens[i + 2]?.value === "to") {
      const name = tokens[i + 1].value;
      const x = Number(tokens[i + 3].value);
      const y = Number(tokens[i + 4].value);

      let speed = 1;
      let advance = 5; // move name to X Y

      if (tokens[i + 5]?.value === "speed") {
        speed = Number(tokens[i + 6].value);
        advance = 7; // move name to X Y speed N
      }

      commands.push({
        type: "MoveTo",
        name,
        x,
        y,
        speed,
      });

      i += advance;
      continue;
    }

    // ─────────────────────────────
    // MOVE (relative): move name dx dy [speed N]
    // ─────────────────────────────
    if (t.value === "move") {
      const name = tokens[i + 1].value;
      const dx = Number(tokens[i + 2].value);
      const dy = Number(tokens[i + 3].value);

      let speed: number | undefined = undefined;
      let advance = 4; // move name dx dy

      if (tokens[i + 4]?.value === "speed") {
        speed = Number(tokens[i + 5].value);
        advance = 6; // move name dx dy speed N
      }

      commands.push({
        type: "Move",
        name,
        dx,
        dy,
        speed,
      });

      i += advance;
      continue;
    }

    // ─────────────────────────────
    // SPAWN: spawn name x y color
    // ─────────────────────────────
    if (t.value === "spawn") {
      const name = tokens[i + 1].value;
      const x = Number(tokens[i + 2].value);
      const y = Number(tokens[i + 3].value);
      const color = tokens[i + 4]?.value ?? "gray";

      commands.push({
        type: "Spawn",
        name,
        x,
        y,
        color,
      });

      i += 5;
      continue;
    }

    // ─────────────────────────────
    // CONTROL: control name with scheme
    // e.g. control player with arrows
    // ─────────────────────────────
    if (t.value === "control") {
      const name = tokens[i + 1].value;
      const scheme = tokens[i + 3].value; // skip "with"

      commands.push({
        type: "Control",
        name,
        scheme,
      });

      i += 4;
      continue;
    }

    // ─────────────────────────────
    // REPEAT: repeat N times { ... }
    // ─────────────────────────────
    if (t.value === "repeat") {
      const count = Number(tokens[i + 1].value);

      if (tokens[i + 2]?.value !== "times") {
        throw new Error("Expected 'times' after repeat");
      }
      if (tokens[i + 3]?.value !== "{") {
        throw new Error("Expected '{' after 'repeat N times'");
      }

      // parse inside block, starting after '{'
      const inner = parseBlock(tokens, i + 4);

      commands.push({
        type: "Repeat",
        count,
        body: inner.commands,
      });

      // skip past the closing '}'
      i = inner.index + 1;
      continue;
    }

    // ─────────────────────────────
    // RENDER
    // ─────────────────────────────
    if (t.value === "render") {
      commands.push({ type: "Render" });
      i += 1;
      continue;
    }

    console.warn("Unknown command:", t);
    i += 1;
  }

  return { commands, index: i };
}
