import { Token } from "./lexer";
import { Program, CommandNode } from "./ast";

export function parse(tokens: Token[]): Program {
  const body: CommandNode[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // SPAWN COMMAND
    if (t.value === "spawn") {
      const name = tokens[i + 1]?.value;
      const x = Number(tokens[i + 2]?.value);
      const y = Number(tokens[i + 3]?.value);
      const color = tokens[i + 4]?.value || "gray";

      body.push({ type: "Spawn", name, x, y, color });
      i += 4; // Skip past used tokens
    }

    else if (t.value === "move" &&
         ["up","down","left","right"].includes(tokens[i+2]?.value)) {

  const name = tokens[i+1].value;
  const direction = tokens[i+2].value;

  let speed = 1;
  if (tokens[i+3]?.value === "speed") {
    speed = Number(tokens[i+4].value);
    i += 4;
  } else {
    i += 2;
  }

  body.push({
    type: "MoveDir",
    name,
    direction,
    speed
  });
}
else if (t.value === "stop") {
  body.push({
    type: "Stop",
    name: tokens[i+1].value
  });
  i += 1;
}


    else if (t.value === "move" && tokens[i+2]?.value === "to") {
  const name = tokens[i+1].value;
  const x = Number(tokens[i+3].value);
  const y = Number(tokens[i+4].value);

  let speed = 1;
  if (tokens[i+5]?.value === "speed") {
    speed = Number(tokens[i+6].value);
    i += 6;
  } else {
    i += 4;
  }

  body.push({
    type: "MoveTo",
    name,
    x,
    y,
    speed
  });
}


    // MOVE COMMAND
    else if (t.value === "move") {
      const name = tokens[i + 1]?.value;
      const dx = Number(tokens[i + 2]?.value);
      const dy = Number(tokens[i + 3]?.value);

      body.push({ type: "Move", name, dx, dy });
      i += 3;
    }

    else if (t.value === "control") {
  const name = tokens[i + 1]?.value;
  const scheme = tokens[i + 3]?.value; // skip "with"

  body.push({
    type: "Control",
    name,
    scheme
  });

  i += 3;
}

else if (t.value === "repeat") {
  const count = Number(tokens[i + 1]?.value);

  // expecting: repeat 5 times {
  if (tokens[i + 2]?.value !== "times") {
    throw new Error("Expected 'times' after repeat");
  }
  if (tokens[i + 3]?.value !== "{") {
    throw new Error("Expected '{' after repeat count");
  }

  i += 4; // skip to first token inside brace

  const inner: CommandNode[] = [];

  // parse until matching "}"
  while (tokens[i]?.value !== "}") {
    const innerToken = tokens[i];

    

    if (innerToken.value === "move") {
     
  const name = tokens[i + 1]?.value;
  const dx = Number(tokens[i + 2]?.value);
  const dy = Number(tokens[i + 3]?.value);

  let speed: number | undefined = undefined;

  // Check for "speed" keyword (optional)
  if (tokens[i + 4]?.value === "speed") {
    speed = Number(tokens[i + 5]?.value);
    body.push({ type: "Move", name, dx, dy, speed });
    i += 5;
  } else {
    body.push({ type: "Move", name, dx, dy });
    i += 3;
  }
}


    else if (innerToken.value === "spawn") {
      inner.push({
        type: "Spawn",
        name: tokens[i + 1].value,
        x: Number(tokens[i + 2].value),
        y: Number(tokens[i + 3].value),
        color: tokens[i + 4].value,
      });
      i += 5;
    }

    else {
      console.error("Unknown command in repeat:", innerToken);
      i++;
    }
  }

  // skip closing brace
  i++;

  body.push({
    type: "Repeat",
    count,
    body: inner,
  });
}



    // RENDER COMMAND
    else if (t.value === "render") {
      body.push({ type: "Render" });
    }
  }

  

  return { type: "Program", body };
}
