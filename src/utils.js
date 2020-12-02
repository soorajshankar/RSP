import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLScalarType
} from "graphql";

export function setDeep(obj, path, value, setrecursively = false) {
  path.reduce((a, b, level) => {
    if (
      setrecursively &&
      typeof a[b] === "undefined" &&
      level !== path.length
    ) {
      a[b] = {};
      return a[b];
    }

    if (level === path.length) {
      a[b] = value;
      return value;
    }
    return a[b];
  }, obj);
  return obj;
}

export const getGqlTypeName = (typeObj) => {
  if (typeObj.ofType) {
    return getGqlTypeName(typeObj.ofType);
  } else return typeObj.name;
};

export const getTree = (schema, type) => {
  const fields =
    type === "QUERY"
      ? schema.getQueryType().getFields()
      : schema.getMutationType().getFields();
  return Object.values(fields).map(
    ({ name, args: argArray, type, ...rest }) => {
      const args = argArray.reduce((p, c, cIx) => {
        return { ...p, [c.name]: { ...c } };
      }, {});
      return { name, checked: true, args, return: type.toString(), ...rest };
    }
  );
};

export const getType = (schema) => {
  const fields = schema.getTypeMap();
  const types = [];
  console.log({ fields });
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof GraphQLScalarType) return;

    const name = value.inspect();
    if (name === "query_root" || name === "mutation_root") return;

    let type = {
      name
    };

    let childArray = [];
    if (value._fields) {
      const fields = value.getFields();
      Object.entries(fields).forEach(([k, v]) => {
        childArray.push({
          name: v.name,
          checked: true,
          return: v.type.toString()
        });
      });
    }
    type.children = childArray;
    types.push(type);
  });
  return types;
};

// utils
export const generateSDL = (types, argTree) => {
  let result = "";
  types.forEach((type) => {
    result = result + "\n" + getSDLField(type, argTree) + "\n";
  });
  return result;
};
const getSDLField = (type, argTree) => {
  let result = `type ${type.name}{`;
  type.children.map((f) => {
    // TODO filter selected fields
    if (!f.checked) return;

    // TODO handle types, this will handle only query and mutations, ie: it adds the brackets
    let fieldStr = f.name;
    if (f?.args) {
      fieldStr = fieldStr + "(";
      Object.values(f.args).map((arg) => {
        if (argTree && argTree[f.name] && argTree[f.name][arg.name]) {
          const jsonStr = JSON.stringify(argTree[f.name][arg.name]);
          const unquoted = jsonStr.replace(/"([^"]+)":/g, "$1:");
          const valueStr = `${arg.name} : ${getGqlTypeName(
            arg.type
          )} @preset(value: ${unquoted})`;
          fieldStr = fieldStr + valueStr + " ,";
        }
      });
      fieldStr = fieldStr + "): " + f.return;
    } else fieldStr = fieldStr + " : " + f.return; // normal data type - ie: without arguments/ presets

    result = `${result}
      ${fieldStr}`;
  });
  return result + "\n}";
};

export const getChildArgument = (v) => {
  if (typeof v === "string") return { children: null }; // value field
  if (v?.type instanceof GraphQLInputObjectType && v?.type?.getFields)
    return { children: v?.type?.getFields(), path: "type._fields" };
  if (v?.type instanceof GraphQLNonNull || v?.type?.ofType) {
    return { children: v?.type?.ofType?._fields, path: "type.ofType._fields" };
  }
  return {};
};
