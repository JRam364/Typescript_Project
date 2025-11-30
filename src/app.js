import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { GameWorld } from "./runtime/engine.js";   // FIXED
import { executeScript } from "./interpreter.js";


let editor;

// Load MONACO EDITOR
require.config({
  paths: {
    "vs": "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs"
  }
});

require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById("editor"), {
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
});

// RUN BUTTON → run code through engine
document.getElementById("runBtn").onclick = async () => {
  const code = editor.getValue();

  const tokens = tokenize(code);
  const ast = parse(tokens);

  const canvas = document.getElementById("game");
  const world = new GameWorld(canvas);

  // start game loop
  world.run();

  // run script async (so movement resolves)
  executeScript(ast.body, world);
};
