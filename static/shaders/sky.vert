#version 300 es
layout(location=0) in vec3 position;

out vec3 v_view; // We send the vector from the camera position to the world position of the vertex to the fragment shader

uniform mat4 M; // To get the world position of the vertex, we need M separately
uniform mat4 VP;
uniform vec3 cam_position; // The camera position in need to calculate the view vector

void main(){
    vec4 world = M * vec4(position, 1.0f);
    // Note that we will replace the z component with the w component so that the depth will always be 1 after division
    // This will ensure that the sky pixels will always be the farthest pixels in the scene
    gl_Position = (VP * world).xyww;
    v_view = world.xyz - cam_position;
}