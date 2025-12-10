
import { RuntimeContext } from "./context";

export interface Entity {
  x: number;
  y: number;
  color: string;

  width: number;
  height: number;

  speed: number;
  vx?: number;
  vy?: number;


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





    
// Relative movement (dx, dy over time)
move(name: string, dx: number, dy: number, speed = 1): Promise<void> {
  const e = this.entities[name];
  if (!e) return Promise.resolve();

  return new Promise(resolve => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(dist / speed));

    e.vx = dx / steps;     // <-- ADD
    e.vy = dy / steps;     // <-- ADD

    e.currentMove = {
      type: "linear",
      dxStep: dx / steps,
      dyStep: dy / steps,
      stepsRemaining: steps,
      resolve
    };
  });
}


// Move to function moves to exact coordinates on game canvas
moveTo(name: string, x: number, y: number, speed: number): Promise<void> {
  const e = this.entities[name];
  if (!e) return Promise.resolve();

  return new Promise(resolve => {
    // compute initial velocity direction
    const dx = x - e.x;
    const dy = y - e.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;

    e.vx = (dx / dist) * speed;   // <-- ADD
    e.vy = (dy / dist) * speed;   // <-- ADD

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

    let vx = 0;
    let vy = 0;

    if (this.controlScheme === "arrows") {
        if (this.keys.has("ArrowUp"))    vy += e.speed;
        if (this.keys.has("ArrowDown"))  vy -= e.speed;
        if (this.keys.has("ArrowLeft"))  vx -= e.speed;
        if (this.keys.has("ArrowRight")) vx += e.speed;
    }

    if (this.controlScheme === "wasd") {
        if (this.keys.has("w")) vy += e.speed;
        if (this.keys.has("s")) vy -= e.speed;
        if (this.keys.has("a")) vx -= e.speed;
        if (this.keys.has("d")) vx += e.speed;
    }

    // Save velocity for physics
    e.vx = vx;
    e.vy = vy;

    // Apply movement
    e.x += vx;
    e.y += vy;

    
}


    
collisionHandlers: { [key: string]: (other: string) => void } = {};

onCollision(name: string, handler: (other: string) => void) {
    this.collisionHandlers[name] = handler;
}
private checkCollision(A: Entity, B: Entity): boolean {
  return !(
    A.x + A.width < B.x ||
    A.x > B.x + B.width ||
    A.y + A.height < B.y ||
    A.y > B.y + B.height
  );
}

private getCollisionEntity(self: Entity, selfName: string): string | null {
  for (const [name, e] of Object.entries(this.entities)) {
    if (name === selfName) continue;
    if (this.checkCollision(self, e)) return name;
  }
  return null;
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

        // -------------------------------------------
        // MOVEMENT
        // -------------------------------------------
        if (m.type === "linear") {
            e.x += m.dxStep;
            e.y += m.dyStep;
            m.stepsRemaining--;

            if (m.stepsRemaining <= 0) {
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

        // -------------------------------------------
        // PUSHBACK (MUST be inside loop!)
        // -------------------------------------------
        // --- PUSHBACK & SEPARATION ---
        const moverName = Object.keys(this.entities).find(key => this.entities[key] === e);

        if (moverName) {
            const hitName = this.getCollisionEntity(e, moverName);

            if (hitName) {
                const pushed = this.entities[hitName];

                // 1. Compute overlap
                const overlapX =
                    (e.width / 2 + pushed.width / 2) -
                    Math.abs((e.x + e.width / 2) - (pushed.x + pushed.width / 2));

                const overlapY =
                    (e.height / 2 + pushed.height / 2) -
                    Math.abs((e.y + e.height / 2) - (pushed.y + pushed.height / 2));

                // 2. Push along the axis of deepest penetration
                if (overlapX < overlapY) {
                    // Push horizontally
                    if (e.x < pushed.x) pushed.x += overlapX;
                    else pushed.x -= overlapX;
                } else {
                    // Push vertically
                    if (e.y < pushed.y) pushed.y += overlapY;
                    else pushed.y -= overlapY;
                }

                // 3. Add velocity-based push force
                const fx = (e.vx ?? 0) * 2;
                const fy = (e.vy ?? 0) * 2;

                pushed.x += fx;
        pushed.y += fy;

        // Stop mover from continuing to overlap
        e.currentMove = null;
        e.vx = 0;
        e.vy = 0;

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
