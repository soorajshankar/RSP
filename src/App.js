import { buildClientSchema } from "graphql";
import React, { useEffect, useState } from "react";
import Tree from "./components/Tree";
import { SCHEMA } from "./constants";
import "./styles.css";

export default function App() {
  return (
    <div>
      <Test />
    </div>
  );
}

const Test = () => {
  const [datasource, setDatasource] = useState([]);
  useEffect(() => {
    const schema = buildClientSchema(SCHEMA);
    setDatasource([
      {
        name: "query_root",
        children: getQueryTree(schema) //.getQueryType().getFields())
      },
      {
        name: "mutation_root",
        children: getMutationTree(schema)
      }
    ]);
    // console.log(schema.getQueryType().getFields());
    // console.log(schema.getSubscriptionType().getFields());
    // console.log(schema.getMutationType().getFields());
  }, []);
  // console.log({ datasource });
  return datasource && datasource.length && <Tree {...{ datasource }} />;
};

const getMutationTree = (schema) => {
  return Object.values(schema.getMutationType().getFields()).map(
    ({ name, args: argArray }) => {
      const args = argArray.reduce((p, c, cIx) => {
        return { ...p, [c.name]: { ...c } };
      }, {});

      return { name, checked: true, args };
    }
  );
};
const getQueryTree = (schema) => {
  return Object.values(schema.getQueryType().getFields()).map(
    ({ name, args: argArray }) => {
      const args = argArray.reduce((p, c, cIx) => {
        return { ...p, [c.name]: { ...c } };
      }, {});

      return { name, checked: true, args };
    }
  );
};
