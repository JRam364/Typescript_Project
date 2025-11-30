import { tokenize } from "./lexer";
import { parse } from "./parser";
import { GameWorld } from "./runtime/engine";

async function execute(node: any, world: GameWorld): Promise<void> {
  switch (node.type) {

    case "Spawn":
      world.spawn(node.name, node.x, node.y, node.color);
      break;

    case "Move":
      // relative movement: dx dy
      world.move(node.name, node.dx, node.dy, node.speed ?? 1);
      break;

    case "MoveDir":
      // continuous directional movement until stop()
      world.moveDir(node.name, node.direction, node.speed ?? 1);
      break;

    case "MoveTo":
      // one-time movement that stops automatically
      await world.moveTo(node.name, node.x, node.y, node.speed);
      break;

    case "Stop":
      world.stop(node.name);
      break;

    case "Control":
      world.enableControl(node.name, node.scheme);
      break;

    case "Repeat":
      for (let i = 0; i < node.count; i++) {
        for (const inner of node.body) {
          await execute(inner, world);
        }
      }
      break;
  }
}


async function main() {
  const response = await fetch("/examples/demo.gm");
  const source = await response.text();

  const tokens = tokenize(source);
  const ast = parse(tokens);

  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const world = new GameWorld(canvas);

  console.log("Starting game loop...");
  world.run();     // <-- RUN FIRST 🔥🔥🔥

  // Then run script asynchronously
  (async () => {
    for (const node of ast.body) {
      await execute(node, world);
    }
  })();
}

main();
