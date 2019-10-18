#version 300 es
precision highp float;

in vec3 v_view;

out vec4 color;


uniform vec4 skyTopColor;
uniform vec4 skyBottomColor;
uniform vec3 sunDirection;
uniform float sunSize;
uniform float sunHalo;
uniform vec4 sunColor;

vec4 skyColor(vec3 direction){
    return mix(skyBottomColor, skyTopColor, 0.5 * (1.0 + direction.y));
}

float sunFactor(vec3 direction){
    return smoothstep(cos(sunSize + sunHalo), cos(sunSize), dot(direction, sunDirection));
}

void main(){
    vec3 direction = normalize(v_view);
    color = skyColor(direction);
    color = mix(color, sunColor, sunFactor(direction));
}