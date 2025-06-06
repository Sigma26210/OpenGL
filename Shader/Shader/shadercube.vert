#version 330

layout (location = 0) in vec3 position;
out vec3 tc;
out float altitude;

uniform mat4 v_matrix;
uniform mat4 p_matrix;
uniform int isAbove;
layout (binding = 0) uniform samplerCube samp;

void main(void)
{
	tc = position;
	mat4 v3_matrix = mat4(mat3(v_matrix));
	gl_Position = p_matrix * v3_matrix * vec4(position,1.0);
	altitude = gl_Position.y;
}
