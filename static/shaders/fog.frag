#version 300 es
precision highp float;

in vec4 v_color;
in vec3 v_view;

out vec4 color;

uniform vec4 tint;

uniform vec4 skyTopColor; // The color of the sky top
uniform vec4 skyBottomColor; // The color of the sky bottom
uniform float fogDistance; // The distance at which the fog color will be 63% of the pixel color (fogAmount = 1-(1/e) = 0.63212055882)

// This function takes the view direction and gets the sky color
// If the direction is (0,-1,0), it will return the sky bottom color
// If the direction is (0,1,0), it will return the sky top color
vec4 skyColor(vec3 direction){
    return mix(skyBottomColor, skyTopColor, 0.5 * (1.0 + direction.y));
}

// This function takes the distance and return the amount of fog
// Here we use exponential fog which is a simple approximation of real fog
float fogAmount(float dist){
    return 1.0 - exp( -dist / fogDistance );
}


void main(){
    color = v_color * tint;

    vec4 fogColor = skyColor(normalize(v_view)); // Get the sky color from the view direction
    
    color = mix(color, fogColor, fogAmount(length(v_view))); // Mix the pixel color with the fog color based the fog amount
}