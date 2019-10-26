#version 300 es
precision highp float;

in vec3 v_view;

out vec4 color;

uniform vec4 skyTopColor; // The color of the sky top
uniform vec4 skyBottomColor; // The color of the sky bottom
uniform vec3 sunDirection; // The direction of the sun in the sky
uniform float sunSize; // The size of the sun in radians. If you are looking at the sun, this will be the angle between the ray from the camera to the sun center and the ray from the camera to any point on the sun circumference.
uniform float sunHalo; // The size of the halo around the sun, it is used to make the sun look smoother
uniform vec4 sunColor; // The color of the sun

// This function takes the view direction and gets the sky color
// If the direction is (0,-1,0), it will return the sky bottom color
// If the direction is (0,1,0), it will return the sky top color
vec4 skyColor(vec3 direction){
    return mix(skyBottomColor, skyTopColor, 0.5 * (1.0 + direction.y));
}

// Given the view direction, this function will return 1 if it looks into the sun and 0 if not. Values between 0 and 1 are for the Halo
float sunFactor(vec3 direction){
    return smoothstep(cos(sunSize + sunHalo), cos(sunSize), dot(direction, sunDirection));
}

void main(){
    vec3 direction = normalize(v_view);
    color = skyColor(direction); // get the sky color
    color = mix(color, sunColor, sunFactor(direction)); // Then mix it with the sun color if that direction looks at the sun
}