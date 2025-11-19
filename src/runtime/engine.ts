export class GameWorld {
  private ctx: CanvasRenderingContext2D;
  private keys: Set<string> = new Set();

  private entities: Record<
    string,
    {
     
  x: number;
  y: number;
  color: string;
  speed: number;
  actions: { dx: number; dy: number; speed: number; remaining: number }[];
  vx:number;
  vy: number;
  targetX: number;
  targetY: number;



    }
  > = {};

  // Who the player controls
  private controlledEntity: string | null = null;
  private controlScheme: "arrows" | "wasd" | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not found");
    this.ctx = ctx;

    // Capture keyboard input
    window.addEventListener("keydown", (e) => this.keys.add(e.key));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));
  }

  


  // Used by your .gm language (spawn)
  spawn(name: string, x: number, y: number, color = "white") {
  this.entities[name] = { 
  x, y, color, speed: 4,
  actions: [],
  vx: 0, vy: 0
};

}


  // Used by your .gm language (move)
  move(name: string, dx: number, dy: number, speed = 1) {
  const e = this.entities[name];
  if (!e) return;

  const distance = Math.sqrt(dx*dx + dy*dy);
  const steps = Math.max(1, Math.floor(distance / speed));

  e.actions.push({
    dx: dx / steps,
    dy: dy / steps,
    speed,
    remaining: steps
  });
}

moveTo(name: string, x: number, y: number, speed: number) {
  const e = this.entities[name];
  if (!e) return;

  const dx = x - e.x;
  const dy = y - e.y;
  const dist = Math.sqrt(dx*dx + dy*dy);

  e.vx = (dx / dist) * speed;
  e.vy = (dy / dist) * speed;
  e.targetX = x;
  e.targetY = y;
}

moveDir(name: string, direction: string, speed: number) {
  const e = this.entities[name];
  if (!e) return;

  if (direction === "right") { e.vx = speed; e.vy = 0; }
  if (direction === "left")  { e.vx = -speed; e.vy = 0; }
  if (direction === "up")    { e.vx = 0; e.vy = -speed; }
  if (direction === "down")  { e.vx = 0; e.vy = speed; }
}

stop(name: string) {
  const e = this.entities[name];
  if (!e) return;
  e.vx = 0;
  e.vy = 0;
}


  // Used by your .gm language (control)
  enableControl(name: string, scheme: string) {
    this.controlledEntity = name;
    this.controlScheme = scheme as "arrows" | "wasd";
  }

  // Main update loop
  private update() {
    // Apply keyboard control to the controlled entity
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
for (const e of Object.values(this.entities)) {
  e.x += e.vx;
  e.y += e.vy;

  // stop when reaching MoveTo target
  if (e.targetX !== undefined) {
    if (Math.abs(e.x - e.targetX) < Math.abs(e.vx)) {
      e.x = e.targetX;
      e.y = e.targetY;
      e.vx = 0;
      e.vy = 0;
      delete e.targetX;
      delete e.targetY;
    }
  }
}

    // Apply queued movement actions (animated movement)
for (const e of Object.values(this.entities)) {
  if (e.actions && e.actions.length > 0) {
    const action = e.actions[0];

    e.x += action.dx;
    e.y += action.dy;

    action.remaining--;
    if (action.remaining <= 0) {
      e.actions.shift();
    }
  }
}



    // Clamp all entities inside boundaries
    for (const e of Object.values(this.entities)) {
      e.x = Math.max(0, Math.min(760, e.x));
      e.y = Math.max(0, Math.min(560, e.y));
    }
  }

  // Draw entities every frame
  private render() {
    this.ctx.clearRect(0, 0, 800, 600);
    for (const e of Object.values(this.entities)) {
      this.ctx.fillStyle = e.color;
      this.ctx.fillRect(e.x, e.y, 40, 40);
    }
  }

  // Game Loop
  run() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
