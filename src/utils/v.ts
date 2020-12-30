type Description<T = never> = Primitive | StructDescription<T>;

type StructDescription<T> = {
  [key in keyof T]?: Description<T[key]>;
};
type Primitive = keyof typeof primitiveAssignMap;

type Assign<T> =
  | AssignFn<T>
  | {
      [key in keyof T]?: Assign<T[key]>;
    };

const primitiveAssignMap = {
  bool: <AssignFn<boolean>>(
    ((gl, location) => (value) => gl.uniform1i(location, value ? 1 : 0))
  ),
  int: <AssignFn<number>>(
    ((gl, location) => (value) => gl.uniform1i(location, value))
  ),
  float: <AssignFn<number>>(
    ((gl, location) => (value) => gl.uniform1f(location, value))
  ),
  vec2: <AssignFn<number[]>>(
    ((gl, location) => (values) =>
      gl.uniform2f(location, ...(values as [number, number])))
  ),
  vec3: <AssignFn<number[]>>(
    ((gl, location) => (values) =>
      gl.uniform3f(location, ...(values as [number, number, number])))
  ),
  vec4: <AssignFn<number[]>>((gl, location) => (values) => {
    const [r = 0, g = 0, b = 0, a = 1] = values;
    gl.uniform4f(location, r, g, b, a);
  }),
  // TODO: more types from GLSL
};

type AssignFn<T> = (
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation
) => (values: T) => void;

function getAssignPrimitive(type: Primitive) {
  return primitiveAssignMap[type];
}

function getAssignStruct<T>(des: StructDescription<T>): Assign<T> {
  const assign: Assign<any> = {};
  for (const key in des) {
    const value = des[key];
    if (typeof value === "string") {
      assign[key] = getAssignPrimitive(value as Primitive);
    } else {
      assign[key] = getAssignStruct(value as StructDescription<T[typeof key]>);
    }
  }
  return assign;
}

function runAssign<T>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  assign: Assign<T>,
  data: T,
  scope: string
) {
  switch (typeof assign) {
    case "function":
      const location = gl.getUniformLocation(program, scope);
      if (!location) throw new Error();
      assign(gl, location)(data);
      break;
    case "object":
      for (const key in assign) {
        const $assign = assign[key] as Assign<T[typeof key]>;
        runAssign(gl, program, $assign, data[key], `${scope}.${key}`);
      }
  }
}

function create<T>(description: Description<T>) {
  const assign =
    typeof description === "string"
      ? getAssignPrimitive(description as Primitive)
      : getAssignStruct(description);
  return {
    bind(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
      return {
        feed(data: T) {
          runAssign(gl, program, assign as Assign<T>, data, name);
        },
      };
    },
  };
}

const vec4 = create<number[]>("vec4");
const vec3 = create<number[]>("vec3");
const vec2 = create<number[]>("vec2");
const float = create<number>("float");
const bool = create<boolean>("bool");
const int = create<number>("bool");

export const uniform = {
  struct: create,
  vec4: () => vec4,
  vec3: () => vec3,
  vec2: () => vec2,
  float: () => float,
  bool: () => bool,
  int: () => int,
};

// Transform
type Transformer<T> = TransformerFn<T> | TransformerMap<T>;
type TransformerFn<T> = (original: T) => any;
type TransformerMap<T> = {
  [key in keyof T]?: Transformer<T[key]>;
};

export function transform<T>(data: T, transformer: Transformer<T>) {
  switch (typeof transformer) {
    case "function":
      return transformer(data);
    case "object": {
      const transformed: {
        [key in keyof T]: any;
      } = {} as any;
      for (const key in data) {
        if (key in transformer) {
          const r = transformer[key] as Transformer<T[typeof key]>;
          transformed[key] = transform(data[key], r);
        } else {
          transformed[key] = data[key];
        }
      }

      return transformed;
    }
  }
}
