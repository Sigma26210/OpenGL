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
uniform vec2 texScale;

uniform vec3 ambientColor; // 新增均匀环境光颜色

void main()
{           
    // 应用纹理缩放
    vec2 scaledTexCoords = fs_in.TexCoords * texScale;

    // 获取纹理颜色
    vec3 color = texture(diffuseMap, scaledTexCoords).rgb;

    // 均匀环境光
    vec3 ambient = ambientColor * color;

    // 最终输出
    FragColor = vec4(ambient, 1.0f);
}
