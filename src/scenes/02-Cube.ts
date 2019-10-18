import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4 } from 'gl-matrix';

// In this scene we will draw one colored cube in 3D
// The goal of this scene is to learn about:
// 1- Back face culling
export default class CubeScene extends Scene {
    program: ShaderProgram;
    mesh: Mesh;
    camera: Camera;
    controller: FlyCameraController;

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

        this.mesh = MeshUtils.ColoredCube(this.gl);

        // To keep things organized, we will use two classes we create to handle the camera
        // The camera class contains all the information about the camera
        // The controller class controls the camera
        this.camera = new Camera();
        this.camera.type = 'perspective';
        this.camera.position = vec3.fromValues(0,0,-3);
        this.camera.aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
        this.controller = new FlyCameraController(this.camera, this.game.input);
        this.controller.movementSensitivity = 0.005;

        // Uncomment the following lines to tell WebGL to use Back-face culling
        //this.gl.enable(this.gl.CULL_FACE);
        //this.gl.cullFace(this.gl.BACK); // This tells WebGL that we will remove the back faces
        //this.gl.frontFace(this.gl.CCW); // This tells WebGL that the faces with Counter Clock Wise vertices (relative to the screen) are the front faces

        this.gl.clearColor(0,0,0,1);
    }
    
    public draw(deltaTime: number): void {
        this.controller.update(deltaTime);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.program.use();

        let M = mat4.identity(mat4.create());
        let VP = this.camera.ViewProjectionMatrix; // We get the VP matrix from our camera class
        
        let MVP = mat4.create();
        mat4.mul(MVP, VP, M);

        this.program.setUniformMatrix4fv("MVP", false, MVP);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.mesh.draw(this.gl.TRIANGLES);
    }
    
    public end(): void {
        this.program.dispose();
        this.program = null;
        this.mesh.dispose();
        this.mesh = null;
    }

}