// Here, we import the things we need from other script files 
import Game from './common/game';
import First3DScene from './scenes/01-First3D';
import CubeScene from './scenes/02-Cube';
import GridScene from './scenes/03-Grid';
import MultiViewScene from './scenes/04-Multi-View';
import TreeScene from './scenes/05-Tree';
import ExtraScene from './scenes/06-Extra'

// First thing we need is to get the canvas on which we draw our scenes
const canvas: HTMLCanvasElement = document.querySelector("#app");

// Then we create an instance of the game class and give it the canvas
const game = new Game(canvas);

// Here we list all our scenes and our initial scene
const scenes = {
    "First-3D": First3DScene,
    "Cube": CubeScene,
    "Grid": GridScene,
    "MultiView": MultiViewScene,
    "Tree": TreeScene,
    "Extra": ExtraScene
};
const initialScene = "First-3D";

// Then we add those scenes to the game object and ask it to start the initial scene
game.addScenes(scenes);
game.startScene(initialScene);

// Here we setup a selector element to switch scenes from the webpage
const selector: HTMLSelectElement = document.querySelector("#scenes");
for(let name in scenes){
    let option = document.createElement("option");
    option.text = name;
    option.value = name;
    selector.add(option);
}
selector.value = initialScene;
selector.addEventListener("change", ()=>{
    game.startScene(selector.value);
});