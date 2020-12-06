const amountOfSpheres = 3;
const amountOfLights = 3;

export const fragmentShaderSource = `#version 300 es

precision highp float;

// struct and functions
struct Viewport {
  float width;
  float height;
  float depth;
};

struct Ray {
  vec3 position;
  vec3 direction;
};
vec3 ray_reach(Ray ray, float ratio) {
  return ray.position + ray.direction * ratio;
}

struct Camera {
  vec3 position;
  vec3 direction;
  Viewport viewport;
};
vec3 camera_lookTo(Camera camera, vec3 direction) {
  camera.direction = direction;
  return camera.direction;
}
vec3 camera_targetAt(Camera camera, vec3 target) {
  return camera_lookTo(camera, target - camera.position);
}

struct Light {
  vec3 position;
  vec4 diffuse;
  vec4 specular;
};

struct Material {
  float shininess;
  vec4 ambient;
  vec4 diffuse;
  vec4 specular;
  vec4 reflectivity;
};

struct Sphere {
  vec3 position;
  Material material;
  float radius;
};

float sphere_intersect(Sphere sphere, Ray ray) {
  vec3 d = ray.position - sphere.position;

  float a = dot(ray.direction, ray.direction);
  float b = dot(d, ray.direction) * 2.;
  float c = dot(d, d) - sphere.radius * sphere.radius;

  if (a == 0.) {
    if (b == 0.) {
      if (c == 0.) {
        // result is all real numbers
      } else {
        // no results
      }
    } else {
      return -c / b;
    }
  } else {
    float inDelta = b * b - 4. * a * c;
    if (inDelta == 0.) {
      return -b / 2. / a;
    } else if (inDelta > 0.) {
      float delta = sqrt(inDelta); // greater than 0
      if (a > 0.) return (-b - delta) / 2. / a;
      return (-b + delta) / 2. / a;
    }
  }
  return -1.;
}
// ---

uniform vec2 u_resolution;
uniform int u_max_reflect_times;

uniform vec4 u_background;
uniform vec4 u_ambient;
uniform Camera u_camera;
uniform Sphere u_spheres[${amountOfSpheres}];
uniform Light u_lights[${amountOfLights}];

out vec4 color;

struct Closest {
  int index;
  float scale;
};
Closest getClosestSphereIndex(Ray ray) {
  float minScale = -1.;
  int minIndex = -1;
  for (int i = 0; i < ${amountOfSpheres}; i++) {
    Sphere sphere = u_spheres[i];
    float scale = sphere_intersect(sphere, ray);
    if (scale > 0.) {
      if (scale < minScale || minIndex == -1) {
        minScale = scale;
        minIndex = i;
      }
    }
  }
  return Closest(minIndex, minScale);
}

float getSine(vec3 a, vec3 b) {
  return length(cross(a, b)) / (length(a) * length(b));
}

vec4 shade(Ray ray) {
  vec4 color = vec4(0, 0, 0, 1);
  int depth = 0;
  while (depth < u_max_reflect_times) {

    Closest closest = getClosestSphereIndex(ray);
    Sphere sphere = u_spheres[closest.index]; // unsafe access?

    for (int i = 0; i < ${amountOfLights}; i++) {
      Light light = u_lights[i];

      vec3 toTheLight = light.position - ray.position;
      vec3 toTheSphere = sphere.position - ray.position;
      float d2 = length(toTheSphere) * getSine(ray.direction, toTheSphere);
      float theSin = getSine(ray.direction, toTheLight);
      float d3 = length(toTheLight) * theSin;
      if (d3 < 0.7 && dot(ray.direction, toTheLight) > 0. && (closest.index == -1 || d2 > sphere.radius)) {
        float s = pow(1. - theSin, pow(2., 7.));
        color += vec4(s, s, s, 0) * light.specular;
      }
    }

    if (closest.index == -1) {
      color += u_background;
      break;
    }

    color += u_ambient * sphere.material.ambient;

    vec3 p = ray_reach(ray, closest.scale);
    vec3 n = normalize(p - sphere.position);

    for (int i = 0; i < ${amountOfLights}; i++) {
      Light light = u_lights[i];

      // shadow
      {
        Closest closest2 = getClosestSphereIndex(Ray(light.position, p - light.position));
        // no light or the ray from light is blocked by other shapes?
        if (closest2.index == -1 || closest2.index != closest.index) continue;
      }

      {
        vec3 l = normalize(light.position - p);
        float nl = dot(n, l);
        if (nl <= 0.) {
          // light is incoming from back
          continue;
        }

        // diffuse
        {
          vec4 diffuse = sphere.material.diffuse * light.specular * nl;
          color += diffuse;
        }

        // specular
        {
          vec3 r = n * 2. * nl - l;
          vec3 v = normalize(u_camera.position - p);
          float vr = dot(v, r);
          if (vr > 0.) {
            vec4 specular = light.specular
              * sphere.material.specular
              * pow(vr, sphere.material.shininess);
            color += specular;
          }
        }
      }
    }

    // reflect
    {
      vec3 l = normalize(-ray.direction);
      vec3 r = n * 2. * dot(n, l) - l;
      ray = Ray(p, r);
    }

    depth++;
  }
  return color;
}

Ray getRay(vec2 vp) {
  float width = u_camera.viewport.width;
  float height = u_camera.viewport.height;
  float depth = u_camera.viewport.depth;

  vec3 d = u_camera.direction;
  vec3 horizontal = d.y != 0. || d.x != 0.
    ? normalize(vec3(-d.y, d.x, 0)) * width
    : vec3(width, 0, 0);
  vec3 vertical = d.y != 0. || d.x != 0.
    ? normalize(vec3(d.x * d.z, d.y * d.z, -(d.x * d.x + d.y * d.y))) * height
    : vec3(0, height, 0);

  vec3 baseDirection = normalize(d) * depth;

  vec3 topLeft = baseDirection - horizontal + vertical;
  vec3 topRight = baseDirection + horizontal + vertical;
  vec3 bottomLeft = baseDirection - horizontal - vertical;
  vec3 bottomRight = baseDirection + horizontal - vertical;

  vec3 top = (topRight - topLeft) * vp.x + topLeft;
  vec3 bottom = (bottomRight - bottomLeft) * vp.x + bottomLeft;

  return Ray(u_camera.position, normalize((top - bottom) * vp.y + bottom));
}

// shader toy style :)
vec4 strokePixel(vec2 coord) {
  return shade(getRay(coord));
}

void main() {
  color = strokePixel(gl_FragCoord.xy / u_resolution.xy);
}

`.trim();

export const vertexShaderSource = `#version 300 es

in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`.trim();
