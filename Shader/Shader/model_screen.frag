#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

struct Light
{
    vec3 position;
    vec3 direction;
    vec3 color;
};

uniform sampler2D screenTexture;
uniform sampler2D noiseTexture;

uniform vec3 viewPos;
uniform float time; 
uniform Light light;


void main()
{
    vec3 fog_color = vec3(0.0, 0.36, 0.73);

    float fogStart = 1;
    float fogEnd = 25; 
    vec3 screencolor = texture(screenTexture, TexCoords).rgb;
         
    float distance = length(viewPos.xyz);
    float fogFactor = clamp((fogEnd - distance) / (fogEnd - fogStart), 0.0, 1.0);

    vec2 noiseCoords = TexCoords * 2.0 + vec2(time * 0.6, time * 0.6); 
    float noiseValue = texture(noiseTexture, noiseCoords).r; 
    float disturbance = mix(0.95, 1.05, noiseValue);

    vec3 result = mix(fog_color * disturbance,screencolor,fogFactor)  ;

    FragColor = vec4(result, 1.0);

}