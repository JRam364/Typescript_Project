import { CommandNode } from "../ast";

export interface RuntimeContext {
  vars: Record<string, any>;
  funcs: Record<string, CommandNode[]>;
  onUpdate?: () => void | Promise<void>;   
}


export function createContext(): RuntimeContext {
  return {
    vars: {},
    funcs: {}
  };
}
