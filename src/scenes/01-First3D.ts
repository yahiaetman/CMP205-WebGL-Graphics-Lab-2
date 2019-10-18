import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import { vec3, mat4 } from 'gl-matrix';

// In this scene we will draw one colored rectangle in 3D
// The goal of this scene is to learn about:
// 1- How to create an send an MVP matrix (Model ,View, Projection)
export default class First3DScene extends Scene {
    program: ShaderProgram;
    mesh: Mesh;
    
    camera: {
        position: vec3,
        target: vec3,
        up: vec3,
        fovy: number,
        aspectRatio: number,
        near: number,
        far: number
    };

    public load(): void {
        // These shaders take 2 uniform: MVP for 3D transformation and Tint for modifying colors
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

        // Create a colored rectangle using our new Mesh class
        this.mesh = new Mesh(this.gl, [
            { attributeLocation: 0, buffer: "positions", size: 3, type: this.gl.FLOAT, normalized: false, stride: 0, offset: 0 },
            { attributeLocation: 1, buffer: "colors", size: 4, type: this.gl.UNSIGNED_BYTE, normalized: true, stride: 0, offset: 0 }
        ]);
        this.mesh.setBufferData("positions", new Float32Array([
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5,  0.5, 0.0,
            -0.5,  0.5, 0.0,
        ]), this.gl.STATIC_DRAW);
        this.mesh.setBufferData("colors", new Uint8Array([
            255,   0,   0, 255,
              0, 255,   0, 255,
              0,   0, 255, 255,
            255,   0, 255, 255,
        ]), this.gl.STATIC_DRAW);
        this.mesh.setElementsData(new Uint32Array([
            0, 1, 2,
            2, 3, 0
        ]), this.gl.STATIC_DRAW);

        this.gl.clearColor(0,0,0,1);

        // Add camera data to a dictionary named "camera" (just for organization)
        this.camera = {
            position: vec3.fromValues(0, 0, 1),
            target: vec3.fromValues(0, 0, 0),
            up: vec3.fromValues(0, 1, 0),
            fovy: Math.PI/2,
            aspectRatio: this.gl.drawingBufferWidth/this.gl.drawingBufferHeight,
            near: 0.01,
            far: 1000
        }
        this.setupControls();
    }
    
    public draw(deltaTime: number): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.program.use();

        let M = mat4.identity(mat4.create()); // Since we won't move the rectangle, M is an identity matrix
        // The view matrix can be created using the function LookAt which takes the camera position, its target and its up direction
        let V = mat4.lookAt(mat4.create(), this.camera.position, this.camera.target, this.camera.up);
        // The projection can be done "perspective" for perspective vertices and "ortho" for orthographic matrices
        // For the perspective matrix, we supply the Field of View angle of the Y axis, the aspect ratio, and the near and far planes
        // For the orthographic matrix, we supply our view box (left, right, bottom, top, near, far)
        let P = mat4.perspective(mat4.create(), this.camera.fovy, this.camera.aspectRatio, this.camera.near, this.camera.far);
        
        // Now we multiply our matrices in order P*V*M
        let MVP = mat4.create();
        mat4.mul(MVP, MVP, P);
        mat4.mul(MVP, MVP, V);
        mat4.mul(MVP, MVP, M);

        this.program.setUniformMatrix4fv("MVP", false, MVP);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.mesh.draw(this.gl.TRIANGLES);
    }
    
    public end(): void {
        this.program.dispose();
        this.program = null;
        this.mesh.dispose();
        this.mesh = null;
        this.clearControls();
    }


    /////////////////////////////////////////////////////////
    ////// ADD CONTROL TO THE WEBPAGE (NOT IMPORTNANT) //////
    /////////////////////////////////////////////////////////
    private setupControls() {
        const controls = document.querySelector('#controls');
        const coordinates = ['x', 'y', 'z', 'w'];
        
        const addLabel = (element: HTMLElement, text: string) => {
            let label = document.createElement('label');
            label.className = "control-label";
            label.textContent = text;
            element.appendChild(label);
        }

        const addVector3 = (element: HTMLElement, vector: vec3) => {
            for(let i = 0; i < 3; i++){
                let label = document.createElement('label');
                label.className = "control-label";
                label.textContent = coordinates[i];
                element.appendChild(label);
                let textbox = document.createElement('input');
                textbox.type = "number";
                textbox.step = "0.05";
                textbox.value = vector[i].toString();
                textbox.onchange = () => { vector[i] = Number.parseFloat(textbox.value) };
                element.appendChild(textbox);
            }
        }

        const addNumber = (element: HTMLElement, value: number, callback: (value: number)=>void) => {
            let textbox = document.createElement('input');
            textbox.type = "number";
            textbox.step = "0.05";
            textbox.value = value.toString();
            textbox.onchange = () => { callback(Number.parseFloat(textbox.value)) };
            element.appendChild(textbox);
        }

        let cameraPositionDiv = document.createElement('div');
        cameraPositionDiv.className = "control-row";
        addLabel(cameraPositionDiv, "Camera Position");
        addVector3(cameraPositionDiv, this.camera.position);
        controls.appendChild(cameraPositionDiv);
        
        let cameraTargetDiv = document.createElement('div');
        cameraTargetDiv.className = "control-row";
        addLabel(cameraTargetDiv, "Camera Target");
        addVector3(cameraTargetDiv, this.camera.target);
        controls.appendChild(cameraTargetDiv);
        
        let cameraUpDiv = document.createElement('div');
        cameraUpDiv.className = "control-row";
        addLabel(cameraUpDiv, "Camera Up");
        addVector3(cameraUpDiv, this.camera.up);
        controls.appendChild(cameraUpDiv);

        let cameraFovYAndAspectDiv = document.createElement('div');
        cameraFovYAndAspectDiv.className = "control-row";
        addLabel(cameraFovYAndAspectDiv, "Camera Field of View Y");
        addNumber(cameraFovYAndAspectDiv, this.camera.fovy, (value) => {this.camera.fovy = value;});
        addLabel(cameraFovYAndAspectDiv, "Camera Aspect Ratio");
        addNumber(cameraFovYAndAspectDiv, this.camera.aspectRatio, (value) => {this.camera.aspectRatio = value;});
        controls.appendChild(cameraFovYAndAspectDiv);
        
        let cameraNearFarDiv = document.createElement('div');
        cameraNearFarDiv.className = "control-row";
        addLabel(cameraNearFarDiv, "Camera Near");
        addNumber(cameraNearFarDiv, this.camera.near, (value) => {this.camera.near = value;});
        addLabel(cameraNearFarDiv, "Camera Far");
        addNumber(cameraNearFarDiv, this.camera.far, (value) => {this.camera.far = value;});
        controls.appendChild(cameraNearFarDiv);
    }

    private clearControls() {
        const controls = document.querySelector('#controls');
        controls.innerHTML = "";
    }


}