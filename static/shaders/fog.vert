#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec4 color;

out vec4 v_color;
out vec3 v_view; // We send the vector from the camera position to the world position of the vertex to the fragment shader

uniform mat4 M; // To get the world position of the vertex, we need M separately
uniform mat4 VP;
uniform vec3 cam_position; // The camera position in need to calculate the view vector

void main(){
    vec4 world = M * vec4(position, 1.0f);
    
    v_color = color;
    v_view = world.xyz - cam_position;
    
    gl_Position = VP * world;
}