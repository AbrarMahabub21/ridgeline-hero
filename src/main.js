import { createRenderer } from "./scene/renderer";

const canvas = document.querySelector('.hero-scene');
const renderer = createRenderer(canvas);

function render(){
    renderer.resize();
    renderer.draw();
}

if(renderer){
    render();
    window.addEventListener('resize', render)
}