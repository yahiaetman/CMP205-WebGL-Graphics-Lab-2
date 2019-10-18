import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4, vec4, quat } from 'gl-matrix';

// In this scene we will draw 3 Islands, with 3 trees in each island
// The goal of this scene is to learn about:
// 1- How to multiple matrices (Scene Graphs)
export default class TreeScene extends Scene {
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

        this.mesh = MeshUtils.WhiteCube(this.gl);

        this.camera = new Camera();
        this.camera.type = 'perspective';
        this.camera.position = vec3.fromValues(-20, 10, -20);
        this.camera.direction = vec3.fromValues(1, -0.5, 1);
        this.camera.aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
        this.controller = new FlyCameraController(this.camera, this.game.input);
        this.controller.movementSensitivity = 0.05;

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);

        this.gl.clearColor(0,0,0,1);
    }
    
    public draw(deltaTime: number): void {
        this.controller.update(deltaTime);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.program.use();

        let VP = this.camera.ViewProjectionMatrix;

        this.drawScene(VP); // From this call, we will recursively draw the whole scene
    }

    // This draw the sea and then draw 3 islands at different locations, rotating in different directions
    private drawScene(parent: mat4){
        let MatSea = mat4.clone(parent);
        mat4.scale(MatSea, MatSea, [100, 0.05, 100]);
        this.program.setUniformMatrix4fv("MVP", false, MatSea);
        this.program.setUniform4f("tint", [0.1, 0.1, 0.3, 1.0]);
        this.mesh.draw(this.gl.TRIANGLES);

        for(let z = -1; z <= 1; z++){
            let MatIsland = mat4.clone(parent);
            mat4.translate(MatIsland, MatIsland, [0, 0, z*40]);
            mat4.rotateY(MatIsland, MatIsland, z*0.5*performance.now()/1000);
            this.drawIsland(MatIsland);
        }
    }

    // This will draw the Island ground and will draw 3  trees with different colors, layers, locations and rotation speeds 
    private drawIsland(parent: mat4) {
        const MatGround = mat4.clone(parent)
        mat4.scale(MatGround, MatGround, [24, 0.1, 6]);
        this.program.setUniformMatrix4fv("MVP", false, MatGround);
        this.program.setUniform4f("tint", [0.4, 0.3, 0.1, 1.0]);
        this.mesh.draw(this.gl.TRIANGLES);

        const colors = [
            vec4.fromValues(0.5,0.8,0.1,1),
            vec4.fromValues(0.1,0.5,0.8,1),
            vec4.fromValues(0.8,0.5,0.1,1),
        ]

        for(let x = -1; x <= 1; x++){
            const MatTree = mat4.clone(parent);
            mat4.translate(MatTree, MatTree, [x*20, 0, 0]);
            mat4.rotateY(MatTree, MatTree, x*performance.now()/1000);
            this.drawTree(MatTree, colors[x+1], x+3);
        }
    }

    // This will draw one branch then recursively draw its children
    private drawTree(parent: mat4, color: vec4, layer: number) {
        this.drawBranch(parent, color);
        if(layer == 0) return;
        for(let i = 0; i < 4; i++){
            let MatChild = mat4.clone(parent);
            mat4.translate(MatChild, MatChild, [0, 4, 0]);
            mat4.rotateY(MatChild, MatChild, (2*i+1)*Math.PI/4)
            mat4.rotateZ(MatChild, MatChild, Math.PI/4);
            mat4.scale(MatChild, MatChild, [0.75, 0.75, 0.75]);
            this.drawTree(MatChild, this.rotateColor(color), layer-1);
        }
    }

    // This will draw one branch only
    private drawBranch(parent: mat4, color: vec4) {
        let MatBranch = mat4.clone(parent);
        mat4.scale(MatBranch, MatBranch, [0.25, 2, 0.25]);
        mat4.translate(MatBranch, MatBranch, [0, 1, 0]);
        this.program.setUniformMatrix4fv("MVP", false, MatBranch);
        this.program.setUniform4f("tint", color);
        this.mesh.draw(this.gl.TRIANGLES);
    }

    // This is a helper function to shift colors along the tree layers
    private rotateColor(color: vec4): vec4 {
        return vec4.transformQuat(vec4.create(), color, quat.fromEuler(quat.create(), 0, 22.5, 0));
    }
    
    public end(): void {
        this.program.dispose();
        this.program = null;
        this.mesh.dispose();
        this.mesh = null;
    }

}