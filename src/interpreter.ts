import { CommandNode } from "./ast";
import { GameWorld } from "./runtime/engine";
import { RuntimeContext } from "./runtime/context";

export async function executeBlock(
  commands: CommandNode[],
  world: GameWorld,
  ctx: RuntimeContext
) {
  for (const cmd of commands) {
    await execute(cmd, world, ctx);
  }
}

export async function execute(
  node: CommandNode,
  world: GameWorld,
  ctx: RuntimeContext
): Promise<void> {

  switch (node.type) {

    case "VarDecl":
      ctx.vars[node.name] = node.value;
      return;

    case "Spawn":
      world.spawn(node.name, node.x, node.y, node.color);
      return;

    case "Move":
      await world.move(
        node.name,
        resolveNumber(node.dx, ctx),
        resolveNumber(node.dy, ctx),
        node.speed ?? 1
      );
      return;

    case "MoveTo":
      await world.moveTo(
        node.name,
        resolveNumber(node.x, ctx),
        resolveNumber(node.y, ctx),
        node.speed
      );
      return;

    case "Repeat": {
      let count = resolveValue(node.count, ctx);
      count = Number(count);

      for (let i = 0; i < count; i++) {
        await executeBlock(node.body, world, ctx);
      }
      return;
    }

    case "Control":
      world.enableControl(node.name, node.scheme);
      return;

    case "If": {
      const cond = evaluateCondition(node, ctx);

      if (cond) {
        await executeBlock(node.thenBody, world, ctx);
      } else if (node.elseBody) {
        await executeBlock(node.elseBody, world, ctx);
      }
      return;
    }

    case "While": {
    while (evaluateCondition(node, ctx, world)) {
        await executeBlock(node.body, world, ctx);
    }
    return;
}


    case "FuncDecl":
      ctx.funcs[node.name] = node.body;
      return;

    case "Call":
      const body = ctx.funcs[node.name];
      if (!body) throw new Error("Unknown function: " + node.name);

      await executeBlock(body, world, ctx);
      return;
  }
}

// helpers --------------------

function resolveValue(value: any, ctx: RuntimeContext): any {
  if (typeof value === "number") return value;
  if (ctx.vars.hasOwnProperty(value)) return ctx.vars[value];
  if (value && value.op === "ADD") {
    const leftVal = resolveValue(value.left, ctx);
    return leftVal + value.right;
}

  return value;
}

function resolveNumber(value: any, ctx: RuntimeContext): number {
  const v = resolveValue(value, ctx);
  const n = Number(v);
  if (isNaN(n)) throw new Error("Expected number but got: " + v);
  return n;
}

function evaluateCondition(node: any, ctx: RuntimeContext, world?: GameWorld): boolean {
  const left = resolveValue(node.condition.left, ctx);
  const right = resolveValue(node.condition.right, ctx);

  switch (node.condition.op) {
    case "LT": return left < right;
    case "GT": return left > right;
    case "EQEQ": return left == right;
    case "NOTEQ": return left != right;
  }
  return false;
}

