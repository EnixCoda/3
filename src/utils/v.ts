// type Description<T> = T extends {
//   [key in keyof T]?: any;
// }
//   ? {
//       [key in keyof T]?: Description<T[key]>;
//     }
//   : DataType;
type StructDescription<T> = {
  [key in keyof T]?: StructDescription<T[key]> | Primitive;
};
type Primitive = keyof typeof primitiveAssignMap; // TODO: int, bool

type Assign<T> =
  | AssignFn<T>
  | {
      [key in keyof T]?: Assign<T[key]>;
    };

type ExpectedAny = any;

const primitiveAssignMap = {
  bool: <AssignFn<boolean>>(
    ((gl, location) => (value) => gl.uniform1i(location, value as ExpectedAny))
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
};

function getAssignPrimitive(type: Primitive) {
  return primitiveAssignMap[type];
}

type AssignFn<T> = (
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation
) => (values: T) => void;

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

export function uniform<T>(name: string) {
  function create<Value>(primitiveType: Primitive) {
    return function () {
      const assign = primitiveAssignMap[primitiveType];
      return {
        bind(gl: WebGL2RenderingContext, program: WebGLProgram) {
          const location = gl.getUniformLocation(program, name);
          if (!location) throw new Error();
          return {
            feed(data: Value) {
              assign(gl, location)(data);
            },
          };
        },
      };
    };
  }
  return {
    struct(des: StructDescription<T>) {
      const assign = getAssignStruct(des);
      return {
        bind(gl: WebGL2RenderingContext, program: WebGLProgram) {
          function runAssign<T>(assign: Assign<T>, data: T, scope: string) {
            switch (typeof assign) {
              case "function":
                const location = gl.getUniformLocation(program, scope);
                if (!location) throw new Error();
                assign(gl, location)(data);
                break;
              case "object":
                for (const key in assign) {
                  const $assign = assign[key] as Assign<T[typeof key]>;
                  runAssign($assign, data[key], `${scope}.${key}`);
                }
            }
          }
          return {
            feed(data: T) {
              runAssign(assign, data, name);
            },
          };
        },
      };
    },
    vec4: create<number[]>("vec4"),
    vec3: create<number[]>("vec3"),
    vec2: create<number[]>("vec2"),
    float: create<number>("float"),
    bool: create<boolean>("bool"),
    int: create<number>("bool"),
  };
}

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
