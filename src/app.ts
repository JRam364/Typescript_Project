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

`,
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

    const tokens = tokenize(code);
    const ast = parse(tokens);

    const canvas = document.getElementById("game") as HTMLCanvasElement;
    const world = new GameWorld(canvas);

    const ctx = createContext();

    world.run(ctx);

    // Only RUN THE PROGRAM ONCE
    await executeBlock(ast.body, world, ctx);
};

}


const socket = new WebSocket("ws://localhost:8080");

socket.onopen = () => {
    console.log("Connected to server!");
    socket.send("Hello from client!");
};

socket.onmessage = (msg) => {
    console.log("Server says:", msg.data);
};


//
// MAIN
//
function main() {
  initEditor();
  initRunButton();
}

main();
