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

uniform vec3 ambientColor; // �������Ȼ�������ɫ

void main()
{           
    // Ӧ����������
    vec2 scaledTexCoords = fs_in.TexCoords * texScale;

    // ��ȡ������ɫ
    vec3 color = texture(diffuseMap, scaledTexCoords).rgb;

    // ���Ȼ�����
    vec3 ambient = ambientColor * color;

    // �������
    FragColor = vec4(ambient, 1.0f);
}
