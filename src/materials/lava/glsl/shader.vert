#define LAVA

#include <common>
#include <logdepthbuf_pars_vertex>

uniform float scale;

//varying float vViewTheta;
varying vec2 vUv;

void main() {

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

	//vViewTheta = clamp((normalize(cameraPosition - position).z + 1.0) * 0.5, 0.0, 1.0);
	vUv = uv * scale;

	gl_Position = projectionMatrix * mvPosition;

	#include <logdepthbuf_vertex>

}
