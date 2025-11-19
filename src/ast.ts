export type CommandNode =
  | { type: "Spawn"; name: string; x: number; y: number; color?: string }
  | { type: "Move"; name: string; dx: number; dy: number; speed?: number }
  | { type: "MoveTo"; name: string; x: number; y: number; speed: number }
  | { type: "MoveDir"; name: string; direction: string; speed: number }
  | { type: "Stop"; name: string }
  | { type: "Control"; name: string; scheme: string }
  | { type: "Render" }
  | { type: "Repeat"; count: number; body: CommandNode[] };


export interface Program {
  type: "Program";
  body: CommandNode[];
}
