#version 330 core
out vec4 FragColor;

in VS_OUT {
    vec3 FragPos;
    vec2 TexCoords;
    vec3 TangentLightPos;
    vec3 TangentViewPos;
    vec3 TangentFragPos;
} fs_in;

uniform sampler2D diffuseMap;
uniform sampler2D normalMap;

uniform bool normalMapping;

uniform vec3 lightPos;     // 添加光源位置
uniform vec3 lightColor;   // 添加光源颜色

void main()
{           
    // Obtain normal from normal map in range [0,1]
    vec3 normal = texture(normalMap, fs_in.TexCoords).rgb;
    // Transform normal vector to range [-1,1]
    normal = normalize(normal * 2.0 - 1.0);  // this normal is in tangent space

    // Get diffuse color
    vec3 color = texture(diffuseMap, fs_in.TexCoords).rgb;

    // Ambient light
    vec3 ambient = 0.1 * color;

    // Diffuse light
    vec3 lightDir = normalize(lightPos - fs_in.TangentFragPos);  // 从片段位置到光源的方向
    float diff = max(dot(lightDir, normal), 0.0);  // 计算漫反射
    vec3 diffuse = diff * lightColor * color;  // 漫反射光照，乘以光源颜色

    // Specular light (镜面高光)
    vec3 viewDir = normalize(fs_in.TangentViewPos - fs_in.TangentFragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    vec3 halfwayDir = normalize(lightDir + viewDir);  
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);  // 高光计算
    vec3 specular = lightColor * spec;  // 高光光照，乘以光源颜色

    // Combine results: Ambient + Diffuse + Specular
    FragColor = vec4(ambient + diffuse + specular, 1.0f);
}