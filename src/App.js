import * as GQL from "graphql";
import React, { useEffect, useState } from "react";
import Tree from "./components/Tree";
import { SCHEMA } from "./constants";
import "./styles.css";

const { buildClientSchema } = GQL;

export default function App() {
  return (
    <div>
      <h1>from real schema</h1>
      <Test />
    </div>
  );
}

const Test = () => {
  const [datasource, setDatasource] = useState([]);
  const [schema, setSchema] = useState();
  useEffect(() => {
    const schema = buildClientSchema(SCHEMA);
    window.SCHEMA = schema;
    window.GQL = GQL;
    setSchema(schema);
  }, []);

  useEffect(() => {
    schema &&
      setDatasource([
        {
          name: "query_root",
          children: getTree(schema, "QUERY")
        },
        {
          name: "mutation_root",
          children: getTree(schema, "MUTATION")
        }
      ]);
  }, [schema]);
  return schema && datasource && datasource.length ? (
    <Tree {...{ datasource, schema, setDatasource }} />
  ) : (
    "Loading..."
  );
};

const getTree = (schema, type) => {
  const fields =
    type === "QUERY"
      ? schema.getQueryType().getFields()
      : schema.getMutationType().getFields();
  return Object.values(fields).map(
    ({ name, args: argArray, type, ...rest }) => {
      const args = argArray.reduce((p, c, cIx) => {
        return { ...p, [c.name]: { ...c } };
      }, {});
      return { name, checked: false, args, return: type.toString(), ...rest };
    }
  );
};
