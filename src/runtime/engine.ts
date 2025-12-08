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
            if (this.keys.has("ArrowUp")) e.y -= e.speed;
            if (this.keys.has("ArrowDown")) e.y += e.speed;
            if (this.keys.has("ArrowLeft")) e.x -= e.speed;
            if (this.keys.has("ArrowRight")) e.x += e.speed;
        }

        if (this.controlScheme === "wasd") {
            if (this.keys.has("w")) e.y -= e.speed;
            if (this.keys.has("s")) e.y += e.speed;
            if (this.keys.has("a")) e.x -= e.speed;
            if (this.keys.has("d")) e.x += e.speed;
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
        e.currentMove = null;
        m.resolve();
      }
    }

    else if (m.type === "to") {
      const dx = m.targetX - e.x;
      const dy = m.targetY - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist <= m.speed) {
        e.x = m.targetX;
        e.y = m.targetY;
        e.currentMove = null;
        m.resolve();
      } else {
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
    }

    // -----------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------
    private render() {
        this.ctx.clearRect(0, 0, 800, 600);
        for (const e of Object.values(this.entities)) {
            this.ctx.fillStyle = e.color;
            this.ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    }

    // -----------------------------------------------------------------
    // Game loop (60 FPS)
    // -----------------------------------------------------------------
    run() {
        const loop = () => {
            this.update();
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
