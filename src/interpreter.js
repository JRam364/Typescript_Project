// interpreter.js
export async function executeScript(body, world) {
  for (const node of body) {
    await execute(node, world);
  }
}

async function execute(node, world) {
  switch (node.type) {

    case "Spawn":
      world.spawn(node.name, node.x, node.y, node.color);
      break;

    case "Move":
      world.move(node.name, node.dx, node.dy, node.speed ?? 1);
      break;

    case "MoveDir":
      world.moveDir(node.name, node.direction, node.speed ?? 1);
      break;

    case "MoveTo":
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

    default:
      console.warn("Unknown node type:", node.type, node);
  }
}
