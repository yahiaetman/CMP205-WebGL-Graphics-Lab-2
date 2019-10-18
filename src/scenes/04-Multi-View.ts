import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4, vec2, vec4 } from 'gl-matrix';

// In this scene we will draw a grid of Cube from multiple camera (and one plane from another camera in a fashion similar to UI)
// The goal of this scene is to learn about:
// 1- How to use Viewports
// 2- How to use Scissor tests
export default class MultiViewScene extends Scene {
    program: ShaderProgram;
    cube: Mesh;
    plane: Mesh;
    cameras: Camera[];
    controller: FlyCameraController;
    time: number = 0;
    timeScale: number = 1;

    public load(): void {
        this.game.loader.load({
            ["color.vert"]:{url:'shaders/color.vert', type:'text'},
            ["color.frag"]:{url:'shaders/color.frag', type:'text'}
        });
    } 
    
    public start(): void {
        this.program = new ShaderProgram(this.gl);
        this.program.attach(this.game.loader.resources["color.vert"], this.gl.VERTEX_SHADER);
        this.program.attach(this.game.loader.resources["color.frag"], this.gl.FRAGMENT_SHADER);
        this.program.link();

        this.cube = MeshUtils.WhiteCube(this.gl);
        this.plane = MeshUtils.ColoredPlane(this.gl);

        // We will setup 5 cameras in this scene (4 are fixed and 1 is controlled by they user)
        this.cameras = [];
        this.cameras[0] = new Camera();
        this.cameras[0].type = 'perspective';
        this.cameras[0].position = vec3.fromValues(-3, 3, -3);
        this.cameras[0].direction = vec3.fromValues(3, -3, 3);
        this.cameras[0].aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
        this.controller = new FlyCameraController(this.cameras[0], this.game.input);
        this.controller.movementSensitivity = 0.005;

        this.cameras[1] = new Camera();
        this.cameras[1].type = 'orthographic';
        this.cameras[1].position = vec3.fromValues(0, 3, 0);
        this.cameras[1].direction = vec3.fromValues(0, -1, 0);
        this.cameras[1].up = vec3.fromValues(1, 0, 0);
        this.cameras[1].orthographicHeight = 36;
        this.cameras[1].aspectRatio = 1;

        this.cameras[2] = new Camera();
        this.cameras[2].type = 'orthographic';
        this.cameras[2].position = vec3.fromValues(3, 0, 0);
        this.cameras[2].direction = vec3.fromValues(-1, 0, 0);
        this.cameras[2].up = vec3.fromValues(0, 1, 0);
        this.cameras[2].orthographicHeight = 36;
        this.cameras[2].aspectRatio = 1;

        this.cameras[3] = new Camera();
        this.cameras[3].type = 'orthographic';
        this.cameras[3].position = vec3.fromValues(0, 0, 3);
        this.cameras[3].direction = vec3.fromValues(0, 0, -1);
        this.cameras[3].up = vec3.fromValues(0, 1, 0);
        this.cameras[3].orthographicHeight = 36;
        this.cameras[3].aspectRatio = 1;

        this.cameras[4] = new Camera();
        this.cameras[4].type = 'orthographic';
        this.cameras[4].position = vec3.fromValues(0, 0, 500);
        this.cameras[4].direction = vec3.fromValues(0, 0, -1);
        this.cameras[4].up = vec3.fromValues(0, 1, 0);
        this.cameras[4].orthographicHeight = 10;
        this.cameras[4].aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        this.cameras[4].near = 0;
        this.cameras[4].far = 501;

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);

    }
    
    public draw(deltaTime: number): void {
        this.time += deltaTime * this.timeScale;
        this.controller.update(deltaTime);
        
        this.gl.clearDepth(1.0);
        
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight); // This tells WebGL to set the NDC to fit this rectangle (also this clips geometry outside this rectangle but it doesn't affect gl.clear)
        this.gl.scissor(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight); // This tells WebGL to never modify a pixel outside this rectangle (this affects every WebGL command, including gl.clear)
        this.gl.clearColor(0,0,0,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.drawScene(this.cameras[0].ViewProjectionMatrix); // Draw the scene from the main camera

        // This will enable the scissor test (now we can restrict WebGL to never modify pixels outside a specific rectangle in the screen)
        this.gl.enable(this.gl.SCISSOR_TEST);

        this.gl.viewport(0, 0, 100, 100);
        this.gl.scissor(0, 0, 100, 100);
        this.gl.clearColor(0.5,0.1,0.1,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.drawScene(this.cameras[1].ViewProjectionMatrix); // Draw the scene from the Top camera
        
        this.gl.viewport(0, 100, 100, 100);
        this.gl.scissor(0, 100, 100, 100);
        this.gl.clearColor(0.1,0.5,0.1,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.drawScene(this.cameras[2].ViewProjectionMatrix); // Draw the scene from the Right camera

        this.gl.viewport(100, 0, 100, 100);
        this.gl.scissor(100, 0, 100, 100);
        this.gl.clearColor(0.1,0.1,0.5,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.drawScene(this.cameras[3].ViewProjectionMatrix);  // Draw the scene from the Front camera

        // Now we will disable the Scissor test since we will draw on all of the screen so the scissor test is not needed
        this.gl.disable(this.gl.SCISSOR_TEST);
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.scissor(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT); // Note the we clear the depth only since we want to keep the scene colors but we don't want anything from the scene to be infront of the UI
        

        let MatPlane = mat4.clone(this.cameras[4].ViewProjectionMatrix);
        mat4.translate(MatPlane, MatPlane, [0, 4, 0]);
        mat4.rotateZ(MatPlane, MatPlane, this.time/1000);

        this.program.setUniformMatrix4fv("MVP", false, MatPlane);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);
        this.plane.draw(this.gl.TRIANGLES);

        // Now we will check if the user clicked the box
        // The first step is to get the mouse position in NDC (Normalized Device Coordinates)
        const mouse: vec2 = this.game.input.MousePosition;
        vec2.div(mouse, mouse, [this.game.canvas.width, this.game.canvas.height]);
        vec2.add(mouse, mouse, [-0.5, -0.5]);
        vec2.mul(mouse, mouse, [2, -2]); // In pixel coordinate y points down, while in NDC y points up so I multiply the y by -1
        // Then we apply the inverse of the MVP matrix to get vector in the local space of the object
        const mouseLocal: vec4 = vec4.fromValues(mouse[0], mouse[1], 0, 1);
        vec4.transformMat4(mouseLocal, mouseLocal, mat4.invert(mat4.create(), MatPlane));
        vec4.scale(mouseLocal, mouseLocal, 1/mouseLocal[3]);
        // Finally, we check if the mouse in the local space is inside our rectangle
        if(this.game.input.isButtonJustDown(0) && mouseLocal[0] >= -0.5 && mouseLocal[0] <= 0.5 && mouseLocal[1] >= -0.5 && mouseLocal[1] <= 0.5){
            this.timeScale = 1 - this.timeScale;
        }
    }

    private drawScene(VP: mat4) {
        this.program.use();

        for(let x = -12; x <= 12; x+=2)
            for(let z = -12; z <= 12; z+=2){
            
            let angle = (x+z)/2+this.time/1000;
            let scale = (Math.sin(angle)+1)/2;    
            
            let MatCube = mat4.clone(VP);
            mat4.translate(MatCube, MatCube, [x, 0, z]);
            mat4.scale(MatCube, MatCube, [scale, scale, scale]);
            // Note that the order of operations if from botton to top so here, we scale first then we translate

            this.program.setUniformMatrix4fv("MVP", false, MatCube);
            this.program.setUniform4f("tint", [Math.cos(angle), Math.cos(angle + 2*Math.PI/3), Math.cos(angle + 4*Math.PI/3), 1]);

            this.cube.draw(this.gl.TRIANGLES);
        }
    }
    
    public end(): void {
        this.program.dispose();
        this.program = null;
        this.cube.dispose();
        this.cube = null;
        this.plane.dispose();
        this.plane = null;
    }

}