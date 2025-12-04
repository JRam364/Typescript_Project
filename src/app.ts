import { tokenize } from "./lexer";
import { parse } from "./parser";
import { GameWorld } from "./runtime/engine";
import { execute } from "./interpreter";
import * as monaco from "monaco-editor";

let editor: monaco.editor.IStandaloneCodeEditor;

//
// Initialize Monaco Editor
//
function initEditor() {
  const container = document.getElementById("editor") as HTMLElement;

  editor = monaco.editor.create(container, {
    value: `spawn player 100 100 red
control player with arrows

spawn obstacle 150 100 green

repeat 5 times {
    move obstacle to 50 100 speed 1
    move obstacle to 150 100 speed 1
}`,
    language: "plaintext",
    theme: "vs-dark",
    fontSize: 16
  });
}

//
// RUN BUTTON HANDLER
//
function initRunButton() {
  const runBtn = document.getElementById("runBtn") as HTMLButtonElement;

  runBtn.onclick = () => {
    const code = editor.getValue();

    
   const tokens = tokenize(code);
   console.log("TOKENS:", tokens);

const ast = parse(tokens);

// PRINT AST HERE
console.log(JSON.stringify(ast.body, null, 2));




    const canvas = document.getElementById("game") as HTMLCanvasElement;
    const world = new GameWorld(canvas);

    world.run();
    // Make world visible to browser console
    (window as any).world = world;


    // run each command without blocking
    for (const node of ast.body) {
      execute(node, world);
    }
  };
}

//
// MAIN
//
function main() {
  initEditor();
  initRunButton();
}

main();
