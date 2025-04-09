#version 330 core
out vec4 FragColor;

in vec3 Normal;
in vec3 Position;

uniform vec3 cameraPos;
uniform samplerCube skybox;
uniform float dispersion;  // ����ɫɢǿ��
uniform vec3 backgroundColor; // ͸����ɫ��ģ�ⲣ����ı�����ɫ��

// ���������㣨Schlick ���ƣ�
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main()
{
    vec3 I = normalize(Position - cameraPos); // ���䷽��
    vec3 N = normalize(Normal);  // ���߷���
    
    // �������������ϵ��
    float cosTheta = max(dot(N, -I), 0.0);
    vec3 F0 = vec3(0.04); // ������������������׼ֵ
    vec3 fresnel = fresnelSchlick(cosTheta, F0);

    // ����ɫɢ����ͬ��ɫͨ���������ʣ�
    float IOR_R = 1.52 - dispersion;  // ��������ʣ���ͣ�
    float IOR_G = 1.52;
    float IOR_B = 1.52 + dispersion;  // ���������ʣ���ߣ�

    vec3 T_R = refract(I, N, 1.0 / IOR_R);  // ��ɫ���䷽��
    vec3 T_G = refract(I, N, 1.0 / IOR_G);  // ��ɫ���䷽��
    vec3 T_B = refract(I, N, 1.0 / IOR_B);  // ��ɫ���䷽��

    // ����ɫɢ����⣨��ͬ��ɫͨ�����䲻ͬ��
    vec3 refractionColor = vec3(
        texture(skybox, T_R).r,  // �����������
        texture(skybox, T_G).g,  // �����̹�����
        texture(skybox, T_B).b   // ������������
    );

    // ���㷴���
    vec3 reflectionColor = texture(skybox, reflect(I, N)).rgb;

    // ����͸��⣨��͸�����ı���ɫ��
    vec3 transmissionColor = backgroundColor * 0.5; // �������ߴ�͸������䰵

    // ��� ���������䡢���� �� ͸��
    vec3 mixedRefraction = mix(transmissionColor, refractionColor, 0.8); // 80% �������䣬20% ͸��
    vec3 finalColor = mix(mixedRefraction, reflectionColor, fresnel);

    FragColor = vec4(finalColor, 1.0);
}
