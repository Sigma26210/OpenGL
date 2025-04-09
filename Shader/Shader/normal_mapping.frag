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

uniform vec3 lightPos;     // ��ӹ�Դλ��
uniform vec3 lightColor;   // ��ӹ�Դ��ɫ

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
    vec3 lightDir = normalize(lightPos - fs_in.TangentFragPos);  // ��Ƭ��λ�õ���Դ�ķ���
    float diff = max(dot(lightDir, normal), 0.0);  // ����������
    vec3 diffuse = diff * lightColor * color;  // ��������գ����Թ�Դ��ɫ

    // Specular light (����߹�)
    vec3 viewDir = normalize(fs_in.TangentViewPos - fs_in.TangentFragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    vec3 halfwayDir = normalize(lightDir + viewDir);  
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);  // �߹����
    vec3 specular = lightColor * spec;  // �߹���գ����Թ�Դ��ɫ

    // Combine results: Ambient + Diffuse + Specular
    FragColor = vec4(ambient + diffuse + specular, 1.0f);
}