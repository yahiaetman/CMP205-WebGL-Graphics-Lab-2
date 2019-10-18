#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec4 color; // We added a new attribute color at the location after position

out vec4 v_color;
out vec3 v_view;

uniform mat4 M;
uniform mat4 VP;
uniform vec3 cam_position;

void main(){
    vec4 world = M * vec4(position, 1.0f);
    
    v_color = color;
    v_view = world.xyz - cam_position;
    
    gl_Position = VP * world;
}