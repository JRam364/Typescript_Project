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
spawn obstacle 200 200 green

//If statement

int a = 5
int b = 10

if a < b {
    move player 50 0 speed 1
}
if a < b {
    
    move player 20 20 speed 2
}




// Uncomment to test while loops
/*
int x = 0

while x < 5 {
    move player 10 0
    x = x + 1
}
*/



// Uncomment to test functions
/*

func testmove() {
    move obstacle 50 -50 speed 1
    move obstacle -50 50 speed 1
}

call testmove()

*/




// Uncomment to test nested function

/*
func testmove() {
    move obstacle 50 -50 speed 1
    move obstacle -50 50 speed 1

    call testfunc()
}

func testfunc() {

    move obstacle to 100 100 speed 1
}

call testmove()
*/




// Uncomment to test UI
/*
int score = 0

ui score 100 100 white 28

repeat 5 times {
    move obstacle to 50 100 speed 1
    move obstacle to 150 100 speed 1
    score = score + 1
}
*/



// Uncomment to test out collision 

/*
int hits = 0

ui hits 50 50 white 24

oncollision player {
    hits = hits + 1
    
}
*/



// Dynamically Typed 

/*
num = 3


repeat x times {
    move obstacle 50 100 speed 1
    move obstacle  150 100 speed 1
}

repeat num times {

    move player 30 20 speed 1
}
*/
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
