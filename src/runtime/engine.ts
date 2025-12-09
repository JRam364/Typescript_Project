
import { RuntimeContext } from "./context";

export interface Entity {
  x: number;
  y: number;
  color: string;

  width: number;
  height: number;

  speed: number;

  // ONE active movement at a time
  currentMove: MoveAction | null;
  
}


type MoveAction =
    | {
          type: "linear";   // move dx, dy over N steps
          dxStep: number;
          dyStep: number;
          stepsRemaining: number;
          resolve: () => void;
      }
    | {
          type: "to";       // move toward x,y until reached
          targetX: number;
          targetY: number;
          speed: number;
          resolve: () => void;
      };

export class GameWorld {
    private ctx: CanvasRenderingContext2D;
    private keys: Set<string> = new Set();

    private entities: Record<string, Entity> = {};

    private controlledEntity: string | null = null;
    private controlScheme: "arrows" | "wasd" | null = null;
    runtime: RuntimeContext | null = null;

setContext(ctx: RuntimeContext) {
    this.runtime = ctx;
}


    uiText: {
    text: string;          // original token (variable name or literal)
    x: number;
    y: number;
    color: string;
    size: number;
    isVar: boolean;        // NEW — does this refer to a variable?
}[] = [];


addUI(text: string, x: number, y: number, color: string, size: number, isVar: boolean) {
    // Prevent duplicate UI entries for the same text variable
    this.uiText = this.uiText.filter(ui => ui.text !== text);

    this.uiText.push({ text, x, y, color, size, isVar });
}






    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not found");
        this.ctx = ctx;

        window.addEventListener("keydown", e => this.keys.add(e.key));
        window.addEventListener("keyup", e => this.keys.delete(e.key));
    }

    // -----------------------------------------------------------------
    // Entity creation
    // -----------------------------------------------------------------
    spawn(name: string, x: number, y: number, color = "white") {
        this.entities[name] = {
            x,
            y,
            color,
            width: 40,
            height: 40,
            speed: 4,
            currentMove: null
        };
    }

    getEntity(name: string): Entity | null {
        return this.entities[name] ?? null;
    }

    // Create UI Text
    drawText(text: string, x: number, y: number, color = "white", size = 20) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px Arial`;
    this.ctx.fillText(text, x, y);
}





    // -----------------------------------------------------------------
    // Movement SYSTEM — sequential, one active move per entity
    // -----------------------------------------------------------------
// Relative movement (dx, dy over time)
move(name: string, dx: number, dy: number, speed = 1): Promise<void> {
  const e = this.entities[name];
  if (!e) return Promise.resolve();

  return new Promise(resolve => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(dist / speed));

    e.currentMove = {
      type: "linear",
      dxStep: dx / steps,
      dyStep: dy / steps,
      stepsRemaining: steps,
      resolve
    };
  });
}


    // Absolute movement (go to target)
    moveTo(name: string, x: number, y: number, speed: number): Promise<void> {
        const e = this.entities[name];
        if (!e) return Promise.resolve();

        return new Promise(resolve => {
            e.currentMove = {
                type: "to",
                targetX: x,
                targetY: y,
                speed,
                resolve
            };
        });
    }

    // -----------------------------------------------------------------
    // Keyboard control
    // -----------------------------------------------------------------
    enableControl(name: string, scheme: string) {
        this.controlledEntity = name;
        this.controlScheme = scheme as any;
    }

    private updateControl() {
        if (!this.controlledEntity) return;
        const e = this.entities[this.controlledEntity];
        if (!e) return;

        if (this.controlScheme === "arrows") {
            if (this.keys.has("ArrowUp")) e.y += e.speed;
            if (this.keys.has("ArrowDown")) e.y -= e.speed;
            if (this.keys.has("ArrowLeft")) e.x -= e.speed;
            if (this.keys.has("ArrowRight")) e.x += e.speed;
        }

        if (this.controlScheme === "wasd") {
            if (this.keys.has("w")) e.y += e.speed;
            if (this.keys.has("s")) e.y -= e.speed;
            if (this.keys.has("a")) e.x -= e.speed;
            if (this.keys.has("d")) e.x += e.speed;
        }
    }

    checkCollision(a: Entity, b: Entity): boolean {
    return !(
        a.x + a.width < b.x ||
        a.x > b.x + b.width ||
        a.y + a.height < b.y ||
        a.y > b.y + b.height
    );
}
collisionHandlers: { [key: string]: (other: string) => void } = {};

onCollision(name: string, handler: (other: string) => void) {
    this.collisionHandlers[name] = handler;
}


private updateCollisions() {
    const names = Object.keys(this.entities);

    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const Aname = names[i];
            const Bname = names[j];

            const A = this.entities[Aname];
            const B = this.entities[Bname];

            if (!A || !B) continue;

            if (this.checkCollision(A, B)) {
                // If A has a collision handler, call it
                if (this.collisionHandlers[Aname]) {
                    this.collisionHandlers[Aname](Bname);
                }

                // If B has a collision handler, call it
                if (this.collisionHandlers[Bname]) {
                    this.collisionHandlers[Bname](Aname);
                }
            }
        }
    }
}



    // -----------------------------------------------------------------
    // Update movement for ALL entities
    // -----------------------------------------------------------------
    private updateMovement() {
    for (const e of Object.values(this.entities)) {
        const m = e.currentMove;
        if (!m) continue;

        if (m.type === "linear") {
            e.x += m.dxStep;
            e.y += m.dyStep;
            m.stepsRemaining--;

            if (m.stepsRemaining <= 0) {

                // ✅ ONLY resolve if this move is still the active one
                if (e.currentMove === m) {
                    e.currentMove = null;
                    m.resolve();
                }
            }
        }

        else if (m.type === "to") {
            const dx = m.targetX - e.x;
            const dy = m.targetY - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist <= m.speed && dist !== 0) {

                // ✅ Prevent old replaced move from resolving
                if (e.currentMove === m) {
                    e.x = m.targetX;
                    e.y = m.targetY;
                    e.currentMove = null;
                    m.resolve();
                }

            } else if (dist > 0) {
                e.x += (dx / dist) * m.speed;
                e.y += (dy / dist) * m.speed;
            }
        }
    }
}





    // -----------------------------------------------------------------
    // World update loop
    // -----------------------------------------------------------------
    private update() {
    this.updateControl();
    this.updateMovement();
    this.updateCollisions();   // <-- ADD THIS
}


    // -----------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------
   private render(ctx: RuntimeContext) {
    this.ctx.clearRect(0, 0, 800, 600);

    for (const e of Object.values(this.entities)) {
    this.ctx.fillStyle = e.color;

    // Flip Y-axis so higher numbers go UP instead of DOWN
    const flippedY = 600 - e.y - e.height;  // 600 = canvas height

    this.ctx.fillRect(e.x, flippedY, e.width, e.height);
}


    for (const ui of this.uiText) {
        let drawText = ui.text;

if (ui.isVar && ctx.vars.hasOwnProperty(ui.text)) {
    drawText = String(ctx.vars[ui.text]);
}


        this.ctx.fillStyle = ui.color;
        this.ctx.font = `${ui.size}px Arial`;
        this.ctx.fillText(drawText, ui.x, ui.y);
    }
}





    // -----------------------------------------------------------------
    // Game loop (60 FPS)
    // -----------------------------------------------------------------
    run(ctx: RuntimeContext) {
    const loop = () => {
        this.update();
        this.render(ctx);
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}

onFrame: (() => Promise<void>) | null = null;

}
