#version 330 core
out vec4 FragColor;

in vec2 TexCoords;
in vec3 FragPos;
in vec3 Normal;

uniform sampler2D texture_diffuse1;
uniform vec3 viewPos;
uniform vec3 lightPos;
uniform int lightingMode;

uniform vec3 highlightAnchor;
uniform float highlightRange; // 高光范围控制
uniform float edgeFeatherStrength; // 边缘柔化强度

void main()
{
    vec3 texColor = texture(texture_diffuse1, TexCoords).rgb;
    vec3 norm = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 lightDir = normalize(lightPos - FragPos);
    vec3 halfwayDir = normalize(viewDir + lightDir);

    if (lightingMode == 0) {
        FragColor = vec4(texColor, 1.0);
    }
    else if (lightingMode == 1) {
        float diff = max(dot(norm, lightDir), 0.0);
        float spec = pow(max(dot(norm, halfwayDir), 0.0), 32.0);
        vec3 ambient = 0.3 * vec3(1.0);
        vec3 diffuse = diff * vec3(1.0);
        vec3 specular = 0.3 * spec * vec3(1.0);
        vec3 lighting = (ambient + diffuse + specular);
        FragColor = vec4(texColor * lighting, 1.0);
    }
    else if (lightingMode == 2) {
    vec3 highlightDir = normalize(highlightAnchor - FragPos);

    // Calculate the distance to the UV edge
    float edgeDistanceU = min(TexCoords.x, 1.0 - TexCoords.x);
    float edgeDistanceV = min(TexCoords.y, 1.0 - TexCoords.y);
    float edgeDistance = min(edgeDistanceU, edgeDistanceV);
    float squashFactor = smoothstep(0.1, 0.0, edgeDistance);

    // Base intensity of highlights
    float NdotH = dot(norm, highlightDir);
    float highlightStrength = pow(max(NdotH, 0.0), 100.0);

    // Double smoothstep, split into two layers
    // Inner layer: center glare area
    float innerEdge = smoothstep(0.002, 0.005 + squashFactor * highlightRange, highlightStrength);
    // Outer layer: marginal diffusion area
    float outerEdge = smoothstep(0.02 + squashFactor * highlightRange, 0.005, highlightStrength);

    // Combined two-layer effect
    float highlightMask = innerEdge - outerEdge;
    highlightMask = clamp(highlightMask, 0.0, 1.0); // Overflow prevention

    // Edge softening process 
    highlightMask *= (1.0 - squashFactor * edgeFeatherStrength);

    // Final highlight color
    vec3 highlightColor = vec3(1.0, 0.97, 0.92);
    vec3 resultColor = texColor + highlightMask * highlightColor;

    FragColor = vec4(resultColor, 1.0);
    }
}
