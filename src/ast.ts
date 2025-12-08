export type CommandNode =
  // FUNCTION DECLARATION
  | {
      type: "FuncDecl";
      name: string;
      params: string[];
      body: CommandNode[];
    }

  // FUNCTION CALL
  | {
      type: "Call";
      name: string;
      args: any[];
    }

  // SPAWN
  | {
      type: "Spawn";
      name: string;
      x: number;
      y: number;
      color?: string;
    }

  // MOVE
  | {
      type: "Move";
      name: string;
      dx: number | string;
      dy: number | string;
      speed?: number;
    }

  // MOVETO
  | {
      type: "MoveTo";
      name: string;
      x: number | string;
      y: number | string;
      speed: number;
    }

  // MOVE DIRECTION
  | {
      type: "MoveDir";
      name: string;
      direction: string;
      speed?: number;
    }

  // STOP
  | {
      type: "Stop";
      name: string;
    }

  // CONTROL
  | {
      type: "Control";
      name: string;
      scheme: string;
    }

  // RENDER
  | {
      type: "Render";
    }

  // REPEAT LOOP
  | {
      type: "Repeat";
      count: number | string;
      body: CommandNode[];
    }

  // VARIABLE DECLARATION
  | {
      type: "VarDecl";
      varType: "int" | "string";
      name: string;
      value: any;
    }

  // IF STATEMENT
  | {
      type: "If";
      condition: {
        left: any;
        op: "LT" | "GT" | "EQEQ" | "NOTEQ";
        right: any;
      };
      thenBody: CommandNode[];
      elseBody: CommandNode[] | null;
    }
  |
   {
    type: "While";
    condition: {
      left: any;
      op: "LT" | "GT" | "EQEQ" | "NOTEQ";
      right: any;
    };
    body: CommandNode[];
  };

export interface Program {
  type: "Program";
  body: CommandNode[];
}
