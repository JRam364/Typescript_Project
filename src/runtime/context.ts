export interface RuntimeContext {
  vars: Record<string, any>;
  funcs: Record<string, any>;
}

export function createContext(): RuntimeContext {
  return {
    vars: {},
    funcs: {}
  };
}
