
interface Entity {
  x: number;
  y: number;
  color: string;
  speed: number;

  // for continuous (directional) movement or moveTo
  vx: number;
  vy: number;

  // queue of relative moves: move name dx dy speed
  actions: {
    dx: number;
    dy: number;
    remaining: number;
    onFinish?: () => void;
  }[];

  // for moveTo
  targetX?: number;
  targetY?: number;
  onFinishMove?: () => void;

  [key: string]: any;
}

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

    window.addEventListener("keydown", (e) => this.keys.add(e.key));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));
  }

  // ---------- ENTITY HELPERS ----------

  spawn(name: string, x: number, y: number, color = "white") {
    console.log("SPAWN:", name, x, y, color);
    this.entities[name] = {
      x,
      y,
      color,
      speed: 4,
      vx: 0,
      vy: 0,
      actions: [],
    };
  }

  getEntity(name: string) {
    return this.entities[name] || null;
  }

  // ---------- MOVEMENT APIS (used by your language) ----------

  /**
   * Relative movement: move name dx dy speed
   * Returns a Promise that resolves when the move is finished.
   */
  move(name: string, dx: number, dy: number, speed = 1): Promise<void> {
    const e = this.entities[name];
    if (!e) return Promise.resolve();

    return new Promise((resolve) => {
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(distance / speed));

      e.actions.push({
        dx: dx / steps,
        dy: dy / steps,
        remaining: steps,
        onFinish: resolve,
      });
    });
  }

  /**
   * Absolute movement: move name to x y speed
   * Returns a Promise that resolves when the entity reaches the target.
   */
  moveTo(name: string, x: number, y: number, speed: number): Promise<void> {
    const e = this.entities[name];
    if (!e) return Promise.resolve();

    return new Promise((resolve) => {
      if (x === undefined || y === undefined || speed === undefined) {
        console.error("Invalid moveTo:", name, x, y, speed);
        resolve();
        return;
      }

      if (isNaN(e.x) || isNaN(e.y)) {
        console.error("Cannot move entity with NaN position:", e);
        resolve();
        return;
      }

      const dx = x - e.x;
      const dy = y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!isFinite(dist) || dist === 0) {
        resolve();
        return;
      }

      e.vx = (dx / dist) * speed;
      e.vy = (dy / dist) * speed;

      e.targetX = x;
      e.targetY = y;
      e.onFinishMove = resolve;
    });
  }

  /**
   * Continuous directional movement (until stop())
   */
  moveDir(name: string, direction: string, speed: number) {
    const e = this.entities[name];
    if (!e) return;

    if (direction === "right") {
      e.vx = speed;
      e.vy = 0;
    }
    if (direction === "left") {
      e.vx = -speed;
      e.vy = 0;
    }
    if (direction === "up") {
      e.vx = 0;
      e.vy = -speed;
    }
    if (direction === "down") {
      e.vx = 0;
      e.vy = speed;
    }
  }

  stop(name: string) {
    const e = this.entities[name];
    if (!e) return;
    e.vx = 0;
    e.vy = 0;
  }

  // ---------- CONTROL ----------

  enableControl(name: string, scheme: string) {
    this.controlledEntity = name;
    this.controlScheme = scheme as "arrows" | "wasd";
  }

  // ---------- MAIN UPDATE LOOP ----------

  private update() {
    // keyboard control
    if (this.controlledEntity) {
      const e = this.entities[this.controlledEntity];
      if (e) {
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
    }

    // movement (per entity)
    for (const e of Object.values(this.entities)) {
      // 1) If a moveTo() is active, handle that first and exclusively
      if (e.targetX !== undefined && e.targetY !== undefined) {
        const dx = e.targetX - e.x;
        const dy = e.targetY - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // apply velocity
        e.x += e.vx;
        e.y += e.vy;

        // check arrival
        const stepLen = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
        if (dist <= stepLen) {
          e.x = e.targetX;
          e.y = e.targetY;
          e.vx = 0;
          e.vy = 0;

          const cb = e.onFinishMove;
          if (cb) cb();

          delete e.targetX;
          delete e.targetY;
          delete e.onFinishMove;
        }

        continue; // skip other movement modes if moveTo is active
      }

      // 2) Relative queued actions (move dx dy)
      if (e.actions.length > 0) {
        const action = e.actions[0];

        e.x += action.dx;
        e.y += action.dy;

        action.remaining--;

        if (action.remaining <= 0) {
          if (action.onFinish) action.onFinish();
          e.actions.shift();
        }

        continue; // don't also apply vx/vy this frame
      }

      // 3) Continuous directional movement (from moveDir)
      if (e.vx !== 0 || e.vy !== 0) {
        e.x += e.vx;
        e.y += e.vy;
      }
    }

    // clamp inside canvas
    for (const e of Object.values(this.entities)) {
      e.x = Math.max(0, Math.min(760, e.x));
      e.y = Math.max(0, Math.min(560, e.y));
    }
  }

  // ---------- RENDER ----------

  private render() {
    this.ctx.clearRect(0, 0, 800, 600);
    for (const e of Object.values(this.entities)) {
      this.ctx.fillStyle = e.color;
      this.ctx.fillRect(e.x, e.y, 40, 40);
    }
  }

  // ---------- GAME LOOP ----------

  run() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}