import { Program } from "./ast";

export function generateTS(program: Program): string {
  let output = `import { GameWorld } from "./src/runtime/engine";\nconst world = new GameWorld();\n`;

  for (const node of program.body) {
    if (node.type === "Spawn")
      output += `world.spawn("${node.name}", ${node.x}, ${node.y}, "${node.color ?? "gray"}");\n`;
    else if (node.type === "Move")
      output += `world.move("${node.name}", ${node.dx}, ${node.dy});\n`;
    else if (node.type === "Render")
      output += `world.render();\n`;
  }
  output += `\nworld.run();\n`;
  return output;
}
