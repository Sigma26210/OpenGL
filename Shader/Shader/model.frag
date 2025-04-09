#version 330 core

out vec4 FragColor1;
in vec2 TexCoords;

uniform sampler2D texture_diffuse1;

struct Material {
    sampler2D diffuse;
    sampler2D specular;    
    float shininess;
}; 

struct Light {
    vec3 position;  
    vec3 direction;
    float cutOff;
    float outerCutOff;
  
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
	
    float constant;
    float linear;
    float quadratic;
};

in vec3 FragPos;  
in vec3 Normal;
  
uniform vec3 viewPos;
uniform Material material;
uniform Light light;

void main()
{    
    //FragColor = texture(texture_diffuse1, TexCoords);
    
    vec3 color = texture(texture_diffuse1,TexCoords).rgb;
    vec3 totalLight;

    // ambient
    //vec3 ambient = light.ambient * texture(material.diffuse, TexCoords).rgb;
    vec3 ambient = 0.15f * vec3(1.0f);
    
    // diffuse 
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(FragPos - light.position);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * vec3(1.0f);  
    
    // specular
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);  
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0f);
    vec3 specular = spec * vec3(1.0f);  

    totalLight = (ambient + diffuse + specular) * color * 4.0f ;
    
    // spotlight (soft edges)
    vec3 lightToFrag = normalize(FragPos - light.position);
    float theta = dot(normalize(light.direction),lightToFrag); 
    float epsilon = (light.cutOff - light.outerCutOff);
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
    
    vec3 spotDiffuse = diffuse * intensity;
    vec3 spotSpecular = specular * intensity;

    // attenuation
    float distance    = length(light.position - FragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));    
    ambient  *= attenuation * intensity; 
    spotDiffuse   *= attenuation;
    spotSpecular *= attenuation;   
    vec3 spotLight = (ambient + spotDiffuse + spotSpecular) * color * 2.0f;
        
    vec3 result = totalLight + spotLight;
    FragColor1 = vec4(result, 1.0);
}
