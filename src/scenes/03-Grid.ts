import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4 } from 'gl-matrix';

// In this scene we will draw a Grid of Cube
// The goal of this scene is to learn about:
// 1- How to multiple objects
// 2- How to use the Depth buffer
export default class GridScene extends Scene {
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

        this.camera = new Camera();
        this.camera.type = 'perspective';
        this.camera.position = vec3.fromValues(-3, 3, -3);
        this.camera.direction = vec3.fromValues(3, -3, 3);
        this.camera.aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
        this.controller = new FlyCameraController(this.camera, this.game.input);
        this.controller.movementSensitivity = 0.005;

        // Remmeber Back face culling, it is here too but we can ignore it
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);

        // Uncomment the following lines to enable Depth Testing
        //this.gl.enable(this.gl.DEPTH_TEST);
        //this.gl.depthFunc(this.gl.LESS); // This commands tells WebGL to only draw new pixels if they have LESS depth compared to the already drawn pixel

        this.gl.clearColor(0,0,0,1);
    }
    
    public draw(deltaTime: number): void {
        this.controller.update(deltaTime);

        // Now we need to clear the depth buffer too
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.program.use();

        let VP = this.camera.ViewProjectionMatrix;

        for(let x = -12; x <= 12; x+=3)
            for(let z = -12; z <= 12; z+=3){
            
            let MatCube = mat4.clone(VP);
            mat4.translate(MatCube, MatCube, [x, 0, z]);
            
            this.program.setUniformMatrix4fv("MVP", false, MatCube);
            this.program.setUniform4f("tint", [1, 1, 1, 1]);

            this.mesh.draw(this.gl.TRIANGLES);            
        }
        
    }
    
    public end(): void {
        this.program.dispose();
        this.program = null;
        this.mesh.dispose();
        this.mesh = null;
    }

}