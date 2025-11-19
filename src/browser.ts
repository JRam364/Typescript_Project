import { tokenize } from "./lexer";
import { parse } from "./parser";
import { GameWorld } from "./runtime/engine";

async function main() {
  console.log("Loading .gm file...");

  // Load your GM script
  const response = await fetch("/examples/demo.gm");
  const source = await response.text();

  console.log("Source:", source);

  // Tokenize and parse
  const tokens = tokenize(source);
  const ast = parse(tokens);

  console.log("AST:", ast.body);

  // Setup canvas + world
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const world = new GameWorld(canvas);

  // Interpret AST
  for (const node of ast.body) {
    if (node.type === "Spawn") {
      console.log("SPAWN:", node);
      world.spawn(node.name, node.x, node.y, node.color);
    } 
    else if (node.type === "Move") {
  console.log("MOVE:", node);

  const speed = node.speed ?? 1;

  // apply movement speed multiplier
  world.move(node.name, node.dx * speed, node.dy * speed);
}

    else if (node.type === "Control") {
      console.log("CONTROL NODE:", node);
      world.enableControl(node.name, node.scheme);
    }
    else if (node.type === "Render") {
      console.log("RENDER");
      // render is handled inside world.run()
    }
    else if (node.type === "Repeat") {
  console.log("REPEAT:", node.count, "times");
  for (let r = 0; r < node.count; r++) {
    for (const inner of node.body) {
      if (inner.type === "Move") {
        world.move(inner.name, inner.dx, inner.dy);
      }
      if (inner.type === "Spawn") {
        world.spawn(inner.name, inner.x, inner.y, inner.color);
      }
    }
  }

  
}
else if (node.type === "MoveTo") {
  world.moveTo(node.name, node.x, node.y, node.speed);
}
else if (node.type === "MoveDir") {
  world.moveDir(node.name, node.direction, node.speed);
}
else if (node.type === "Stop") {
  world.stop(node.name);
}


  }

  

  // Start the game loop
  console.log("Starting game loop...");
  world.run();
}

main();
