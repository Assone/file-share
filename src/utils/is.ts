type TypeOfType =
  | "string"
  | "number"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object"
  | "function";

const typeOf =
  <T>(type: TypeOfType) =>
  (value: unknown): value is T =>
    // eslint-disable-next-line valid-typeof
    typeof value === type;

const { toString } = Object.prototype;

const kindCache: Record<string, string> = {};

const kindOf = (value: unknown): string => {
  const type = toString.call(value);

  if (!kindCache[type]) {
    kindCache[type] = type.slice(8, -1).toLowerCase();
  }

  return kindCache[type] as string;
};

export const isString = typeOf<string>("string");

export const isUndefined = typeOf<undefined>("undefined");

export const isObject = (value: unknown): value is object =>
  value !== null && kindOf(value) === "object";

export const isBlob = (value: unknown): value is Blob =>
  kindOf(value) === "blob";

export const isArrayBuffer = (value: unknown): value is ArrayBuffer =>
  kindOf(value) === "arraybuffer";

export const isArrayBufferView = (value: unknown): value is ArrayBufferView =>
  kindOf(value) === "arraybufferview";
