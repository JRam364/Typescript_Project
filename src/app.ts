import { tokenize } from "./lexer";
import { parse } from "./parser";
import { GameWorld } from "./runtime/engine";
import { executeBlock } from "./interpreter";
import { createContext } from "./runtime/context";
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

  runBtn.onclick = async () => {

    const code = editor.getValue();

    // Tokenize + Parse
    const tokens = tokenize(code);
    console.log("TOKENS:", tokens);

    const ast = parse(tokens);
    console.log("AST:", JSON.stringify(ast.body, null, 2));

    // Create game world
    const canvas = document.getElementById("game") as HTMLCanvasElement;
    const world = new GameWorld(canvas);
    world.run();

    // Debugging convenience
    (window as any).world = world;

    // Create runtime variable store
    const ctx = createContext();

    // Execute program SEQUENTIALLY
    await executeBlock(ast.body, world, ctx);
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
