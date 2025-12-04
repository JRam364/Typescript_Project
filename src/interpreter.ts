import { CommandNode } from "./ast";
import { GameWorld } from "./runtime/engine";

const variables: Record<string, any> = {};

export async function execute(node: CommandNode, world: GameWorld): Promise<void> {

  switch (node.type) {
    case "Spawn":
      world.spawn(node.name, node.x, node.y, node.color);
      break;

    case "Move": {
    const dx = typeof node.dx === "string" ? variables[node.dx] : node.dx;
    const dy = typeof node.dy === "string" ? variables[node.dy] : node.dy;

    // ensure values are numbers
    world.move(node.name, Number(dx), Number(dy), node.speed ?? 1);
    break;
}


    case "MoveTo": {
    const x = typeof node.x === "string" ? variables[node.x] : node.x;
    const y = typeof node.y === "string" ? variables[node.y] : node.y;

    await world.moveTo(node.name, Number(x), Number(y), node.speed);
    break;
}



    case "MoveDir":
      world.moveDir(node.name, node.direction, node.speed ?? 1);
      break;

    case "Stop":
      world.stop(node.name);
      break;

    case "Control":
      world.enableControl(node.name, node.scheme);
      break;

    case "Repeat": {
    let repeatCount = node.count;

    // Resolve variable name → numeric value
    if (typeof repeatCount === "string") {
        repeatCount = variables[repeatCount];
    }

    repeatCount = Number(repeatCount) || 0;

    for (let j = 0; j < repeatCount; j++) {
        for (const inner of node.body) {
            await execute(inner, world);
        }
    }
    break;
}


    case "VarDecl":
  if (node.varType === "int") {
    variables[node.name] = Number(node.value);
  } else if (node.varType === "string") {
    variables[node.name] = String(node.value);
  }
  break;


    case "If": {
    let left = typeof node.condition.left === "string"
      ? variables[node.condition.left]
      : node.condition.left;

    let right = typeof node.condition.right === "string"
      ? variables[node.condition.right]
      : node.condition.right;

    let cond = false;

    switch (node.condition.op) {
      case "LT":
        cond = left < right;
        break;
      case "GT":
        cond = left > right;
        break;
      case "EQEQ":
        cond = left === right;
        break;
      case "NOTEQ":
        cond = left !== right;
        break;
    }

    if (cond) {
       for (let cmd of node.thenBody) await execute(cmd, world);
    } else if (node.elseBody) {
       for (let cmd of node.elseBody) await execute(cmd, world);
    }

    break;
}

  }




    function resolve(value: any) {
    if (typeof value === "number") return value;
    if (variables.hasOwnProperty(value)) return variables[value];
    return value;
  }

  
}



// -----------------------------------------
// Evaluate a boolean condition for IF
// -----------------------------------------
function evaluateCondition(node: Extract<CommandNode, { type: "If" }>, world: GameWorld): boolean {
  const left = resolveComparisonValue(node.condition.left, world);
  const right = resolveComparisonValue(node.condition.right, world);

  switch (node.condition.op) {
    case "LT": return left < right;
    case "GT": return left > right;
    case "EQEQ": return left === right;
    case "NOTEQ": return left !== right;
  }

  return false;
}



// -----------------------------------------
// Resolve identifiers or numbers
// player.x  → world.entities[player].x
// enemy.y   → world.entities[enemy].y
// 200       → number literal
// -----------------------------------------
function resolveComparisonValue(value: any, world: GameWorld): number {
  // numeric literal
  if (typeof value === "number") return value;

  // variable
  if (variables.hasOwnProperty(value)) return variables[value];

  // entity property (player.x)
  if (typeof value === "string" && value.includes(".")) {
    const [entity, prop] = value.split(".");
    const ent = world.getEntity(entity);
    if (!ent) return 0;
    return ent[prop] ?? 0;
  }

  return 0;
}


  
