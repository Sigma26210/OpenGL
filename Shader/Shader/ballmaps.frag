#version 330 core
out vec4 FragColor;

in vec3 Normal;
in vec3 Position;

uniform vec3 cameraPos;
uniform samplerCube skybox;
uniform float dispersion;  // 控制色散强度
uniform vec3 backgroundColor; // 透射颜色（模拟玻璃后的背景颜色）

// 菲涅耳计算（Schlick 近似）
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main()
{
    vec3 I = normalize(Position - cameraPos); // 入射方向
    vec3 N = normalize(Normal);  // 法线方向
    
    // 计算菲涅尔反射系数
    float cosTheta = max(dot(N, -I), 0.0);
    vec3 F0 = vec3(0.04); // 玻璃表面菲涅尔反射基准值
    vec3 fresnel = fresnelSchlick(cosTheta, F0);

    // 计算色散（不同颜色通道的折射率）
    float IOR_R = 1.52 - dispersion;  // 红光折射率（最低）
    float IOR_G = 1.52;
    float IOR_B = 1.52 + dispersion;  // 蓝光折射率（最高）

    vec3 T_R = refract(I, N, 1.0 / IOR_R);  // 红色折射方向
    vec3 T_G = refract(I, N, 1.0 / IOR_G);  // 绿色折射方向
    vec3 T_B = refract(I, N, 1.0 / IOR_B);  // 蓝色折射方向

    // 计算色散折射光（不同颜色通道折射不同）
    vec3 refractionColor = vec3(
        texture(skybox, T_R).r,  // 采样红光折射
        texture(skybox, T_G).g,  // 采样绿光折射
        texture(skybox, T_B).b   // 采样蓝光折射
    );

    // 计算反射光
    vec3 reflectionColor = texture(skybox, reflect(I, N)).rgb;

    // 计算透射光（穿透玻璃的背景色）
    vec3 transmissionColor = backgroundColor * 0.5; // 背景光线穿透玻璃后变暗

    // 结合 菲涅尔反射、折射 和 透射
    vec3 mixedRefraction = mix(transmissionColor, refractionColor, 0.8); // 80% 玻璃折射，20% 透射
    vec3 finalColor = mix(mixedRefraction, reflectionColor, fresnel);

    FragColor = vec4(finalColor, 1.0);
}
