#define WATER

#include <common>
#include <logdepthbuf_pars_vertex>

uniform vec3 lightPosition;
uniform vec4 offsetRepeat;

varying vec3 vLightDirection;
varying vec3 vViewPosition;
varying vec4 vFragPosition;
varying mat3 vTbn;
varying vec2 vUv;

attribute vec4 tangent;

void main() {

	vec3 transformedNormal = normalize(normalMatrix * normal);
	vec3 transformedTangent = normalize(normalMatrix * tangent.xyz);

	vTbn = mat3(
		transformedTangent,
		normalize(cross(transformedNormal, transformedTangent) * tangent.w),
		transformedNormal
	);

	vUv = uv * offsetRepeat.zw + offsetRepeat.xy;

	mat3 m3 = mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz);
	vec3 worldPosition = m3 * position;
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vec4 lightVector = viewMatrix * vec4(lightPosition, 1.0);

	vLightDirection = normalize(lightVector.xyz - cameraPosition);
	vViewPosition = mvPosition.xyz;
	vFragPosition = projectionMatrix * mvPosition;

	gl_Position = vFragPosition;

	#include <logdepthbuf_vertex>

}
