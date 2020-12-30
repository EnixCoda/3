#version 300 es

const int amountOfSpheres = 3;
const int amountOfLights = 3;

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
      if (a > 0.)
        return (-b - delta) / 2. / a;
      return (-b + delta) / 2. / a;
    }
  }
  return -1.;
}
// ---

uniform vec2 u_resolution;
uniform int u_maxReflectTimes;

uniform float u_castRange;
uniform bool u_enableDirectLight;
uniform bool u_enableDiffuse;
uniform bool u_enableSpecular;
uniform bool u_enableGlow;

uniform vec4 u_background;
uniform vec4 u_ambient;
uniform Camera u_camera;
uniform Sphere u_spheres[amountOfSpheres];
uniform Light u_lights[amountOfLights];

out vec4 color;

struct Closest {
  int index;
  float scale;
};
Closest getClosestSphereIndex(Ray ray) {
  float minScale = -1.;
  int minIndex = -1;
  for (int i = 0; i < amountOfSpheres; i++) {
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

float getCosine(vec3 a, vec3 b) { return dot(normalize(a), normalize(b)); }

vec4 shade(Ray ray) {
  vec4 color = vec4(0, 0, 0, 1);
  int depth = 0;
  vec4 reflectivity = vec4(1, 1, 1, 1);
  while (depth < u_maxReflectTimes) {
    vec4 rayColor = vec4(0, 0, 0, 1);
    Closest closest = getClosestSphereIndex(ray);
    Sphere sphere = u_spheres[closest.index]; // unsafe access?
    vec3 p = ray_reach(ray, closest.scale);

    if (u_enableDirectLight) {
      for (int i = 0; i < amountOfLights; i++) {
        Light light = u_lights[i];

        vec3 toTheLight = light.position - ray.position;
        float theSine = getSine(ray.direction, toTheLight);
        float theCosine = dot(normalize(ray.direction), normalize(toTheLight));
        float distanceToTheLight = length(toTheLight) * theSine;
        if (distanceToTheLight > u_castRange || theCosine <= 0.) {
          continue;
        }

        if (closest.index == -1 ||
            length(ray.position - p) > length(toTheLight) * theCosine) {
          // Not blocked by sphere
          vec4 lightColor =
              pow(1. - distanceToTheLight / u_castRange, pow(2., 4.)) *
              light.specular;
          rayColor += lightColor;
        } else {
          if (u_enableGlow) {
            // glow
            float c = dot(normalize(sphere.position - p), ray.direction);
            if (c < 0.1)
              rayColor += light.specular * pow(1. - c, pow(2., 3.)) * 2.;
          }
        }
      }
    }

    if (closest.index == -1) {
      if (depth == 0) {
        // ignore background on reflection
        rayColor += u_background;
      }
    } else {
      vec3 n = normalize(p - sphere.position);

      rayColor +=
          u_ambient * sphere.material.ambient * getCosine(ray.direction, -n);

      for (int i = 0; i < amountOfLights; i++) {
        Light light = u_lights[i];

        // shadow
        {
          Closest closest2 =
              getClosestSphereIndex(Ray(light.position, p - light.position));
          // no light or the ray from light is blocked by other shapes?
          if (closest2.index == -1 || closest2.index != closest.index)
            continue;
        }

        {
          vec3 l = normalize(light.position - p);
          float nl = dot(n, l);
          if (nl <= 0.) {
            // light is incoming from back
            continue;
          }

          if (u_enableDiffuse) {
            vec4 diffuse = sphere.material.diffuse * light.specular * nl;
            rayColor += diffuse;
          }

          if (u_enableSpecular) {
            vec3 r = n * 2. * nl - l;
            vec3 v = normalize(u_camera.position - p);
            float vr = dot(v, r);
            if (vr > 0.) {
              vec4 specular = light.specular * sphere.material.specular *
                              pow(vr, sphere.material.shininess);
              rayColor += specular;
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
    }

    color += rayColor * reflectivity;
    reflectivity = sphere.material.reflectivity;
    if (closest.index == -1) {
      break;
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
  vec3 vertical =
      d.y != 0. || d.x != 0.
          ? normalize(vec3(d.x * d.z, d.y * d.z, -(d.x * d.x + d.y * d.y))) *
                height
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
vec4 strokePixel(vec2 coord) { return shade(getRay(coord)); }

void main() { color = strokePixel(gl_FragCoord.xy / u_resolution.xy); }
