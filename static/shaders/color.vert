#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec4 color; // We added a new attribute color at the location after position

out vec4 vertexColor; // Since vertex shaders do not draw, we need to pass the color data to the fragment shader

uniform mat4 MVP; // This matrix will hold all of our transformation (Model, View and Projection)

void main(){
    gl_Position = MVP * vec4(position, 1.0f); // Just multiply by this matrix and..... welcome to the 3rd Dimension
    vertexColor = color; // Pass the color to the fragment shader
}