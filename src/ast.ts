export type CommandNode =
  | {
      type: "Spawn";
      name: string;
      x: number;
      y: number;
      color?: string;
    }
  | {
      type: "Move";
      name: string;
      dx: number | string;
      dy: number | string;
      speed?: number;
    }
  | {
      type: "MoveTo";
      name: string;
      x: number | string;
      y: number | string;
      speed: number;
    }
  | {
      type: "MoveDir";
      name: string;
      direction: string;
      speed?: number;
    }
  | { type: "Stop"; name: string }
  | { type: "Control"; name: string; scheme: string }
  | { type: "Render" }
  | { type: "Repeat"; count: number | string; body: CommandNode[] }

  | {
      type: "VarDecl";
      varType: "int" | "string";
      name: string;
      value: any;
    }
  | {
      type: "If";
      condition: {
        left: any;
        op: "LT" | "GT" | "EQEQ" | "NOTEQ";
        right: any;
      };
      thenBody: CommandNode[];
      elseBody: CommandNode[] | null;
    };

export interface Program {
  type: "Program";
  body: CommandNode[];
}
