import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4 } from 'gl-matrix';

// In this scene we will draw a scene with Fog and a Sky
// The goal of this scene is to learn about:
// 1- How to write a shader that uses transformation for other purposes
// 2- How to draw a sky cube
export default class ExtraScene extends Scene {
    fogProgram: ShaderProgram;
    skyProgram: ShaderProgram;
    cube: Mesh;
    suzanne: Mesh;
    camera: Camera;
    controller: FlyCameraController;

    public load(): void {
        this.game.loader.load({
            ["fog.vert"]:{url:'shaders/fog.vert', type:'text'},
            ["fog.frag"]:{url:'shaders/fog.frag', type:'text'},
            ["sky.vert"]:{url:'shaders/sky.vert', type:'text'},
            ["sky.frag"]:{url:'shaders/sky.frag', type:'text'},
            ["suzanne.obj"]:{url:'models/suzanne.obj', type:'text'}
        });
    } 
    
    public start(): void {
        this.fogProgram = new ShaderProgram(this.gl);
        this.fogProgram.attach(this.game.loader.resources["fog.vert"], this.gl.VERTEX_SHADER);
        this.fogProgram.attach(this.game.loader.resources["fog.frag"], this.gl.FRAGMENT_SHADER);
        this.fogProgram.link();

        this.skyProgram = new ShaderProgram(this.gl);
        this.skyProgram.attach(this.game.loader.resources["sky.vert"], this.gl.VERTEX_SHADER);
        this.skyProgram.attach(this.game.loader.resources["sky.frag"], this.gl.FRAGMENT_SHADER);
        this.skyProgram.link();

        this.cube = MeshUtils.WhiteCube(this.gl);
        this.suzanne = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["suzanne.obj"]);

        this.camera = new Camera();
        this.camera.type = 'perspective';
        this.camera.position = vec3.fromValues(-100, 50, -100);
        this.camera.direction = vec3.fromValues(1, -0.5, 1);
        this.camera.aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
        this.controller = new FlyCameraController(this.camera, this.game.input);
        this.controller.movementSensitivity = 0.05;

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.clearColor(0,0,0,1);
    }
    
    public draw(deltaTime: number): void {
        this.controller.update(deltaTime);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.fogProgram.use();

        this.fogProgram.setUniformMatrix4fv("VP", false, this.camera.ViewProjectionMatrix);
        this.fogProgram.setUniform3f("cam_position", this.camera.position);

        const skyTopColor = [0.2, 0.0, 0.0, 1.0];
        const skyBottomColor = [0.2, 0.2, 0.4, 1.0];

        this.fogProgram.setUniform4f("skyTopColor", skyTopColor);
        this.fogProgram.setUniform4f("skyBottomColor", skyBottomColor);
        this.fogProgram.setUniform1f("fogDistance", 50);

        let MatGround = mat4.create();
        mat4.scale(MatGround, MatGround, [500, 1000, 500]);
        mat4.translate(MatGround, MatGround, [0, -1, 0]);
        this.fogProgram.setUniformMatrix4fv("M", false, MatGround);
        this.fogProgram.setUniform4f("tint", [0.7, 0.7, 0.7, 0.7]);
        this.cube.draw(this.gl.TRIANGLES);

        for(let x = -180; x < 180; x+=6){
            for(let z = -180; z < 180; z+=6){
                // some code to draw the cube landscape (details are not important, just for fun)
                let distanceSqr = (x*x+z*z);
                let top = 10 + 800 * Math.exp(-distanceSqr/960);
                const r = 40;
                let bottom = distanceSqr>(r*r)?0:Math.sqrt(r*r - distanceSqr);

                let MatBuilding = mat4.create();
                mat4.translate(MatBuilding, MatBuilding, [x, bottom, z]);
                mat4.scale(MatBuilding, MatBuilding, [1, top - bottom, 1]);
                mat4.scale(MatBuilding, MatBuilding, [1, 0.5, 1]);
                mat4.translate(MatBuilding, MatBuilding, [0, 1, 0]);

                this.fogProgram.setUniformMatrix4fv("M", false, MatBuilding);
                this.fogProgram.setUniform4f("tint", [0.7, 0.7, 0.7, 0.7]);
                this.cube.draw(this.gl.TRIANGLES);
            }
        }
        
        let MatSuzanne = mat4.create();
        mat4.translate(MatSuzanne, MatSuzanne, [0, 10, 0]);
        mat4.scale(MatSuzanne, MatSuzanne, [10,10,10]);
        this.fogProgram.setUniformMatrix4fv("M", false, MatSuzanne);
        this.fogProgram.setUniform4f("tint", [1.0, 0.4, 0.5, 1.0]);
        this.suzanne.draw(this.gl.TRIANGLES);

        this.gl.cullFace(this.gl.FRONT); // Since the sky cube will be drawn from the inside, we flip the back-face culling to front face culling
        this.gl.depthMask(false); // Since the sky is the farthest thing in the scene, we can skip writing to the depth buffer (for Optimization only)
        // Note that the depth mask function will not disable the depth testing but will prevent us from modifying the depth buffer
        // There are similar functions for the color and stencil buffer:
        // gl.colorMask(red: boolean, green: boolean, blue: boolean, alpha: boolean) => controls writing to every channel in the color buffer
        // gl.stencilMask(mask: number) => controls writing to every bit in the stencil buffer

        this.skyProgram.use();
        this.skyProgram.setUniformMatrix4fv("VP", false, this.camera.ViewProjectionMatrix);
        this.skyProgram.setUniform3f("cam_position", this.camera.position);
        this.skyProgram.setUniform4f("skyTopColor", skyTopColor);
        this.skyProgram.setUniform4f("skyBottomColor", skyBottomColor);
        this.skyProgram.setUniform3f("sunDirection", vec3.normalize(vec3.create(), [1.0, 2.0, 1.0]));
        this.skyProgram.setUniform1f("sunSize", 0.15);
        this.skyProgram.setUniform1f("sunHalo", 0.015);
        this.skyProgram.setUniform4f("sunColor", [0.7, 0.6, 0.5, 1.0]);

        let MatSky = mat4.create();
        mat4.translate(MatSky, MatSky, this.camera.position); // Make sure that the box is centered around the camera
        this.skyProgram.setUniformMatrix4fv("M", false, MatSky);
        this.cube.draw(this.gl.TRIANGLES);

        this.gl.cullFace(this.gl.BACK); // Return Back-face culling to normal
        this.gl.depthMask(true); // Re-enable writing to the depth buffer
    }
    
    public end(): void {
        this.fogProgram.dispose();
        this.fogProgram = null;
        this.cube.dispose();
        this.cube = null;
    }

}