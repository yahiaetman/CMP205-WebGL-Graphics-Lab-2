#version 300 es
precision highp float;

in vec4 v_color;
in vec3 v_view;

out vec4 color;

uniform vec4 tint;

uniform vec4 skyTopColor;
uniform vec4 skyBottomColor;
uniform float fogDistance;

vec4 skyColor(vec3 direction){
    return mix(skyBottomColor, skyTopColor, 0.5 * (1.0 + direction.y));
}

float fogAmount(float dist){
    return 1.0 - exp( -dist / fogDistance );
}


void main(){
    color = v_color * tint;

    vec4 fogColor = skyColor(normalize(v_view));
    
    color = mix(color, fogColor, fogAmount(length(v_view)));
}