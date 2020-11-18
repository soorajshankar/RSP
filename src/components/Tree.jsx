import React, { useCallback, useState } from "react";

const data = [
  {
    name: "Query_root",
    children: [
      { name: "hello", checked: false },
      {
        name: "user",
        checked: false,
        return: "User",
        args: {
          id: {
            type: "sessionVar",
            value: "x-hasura-user-id"
          },
          where: {
            type: "sessionVar",
            value: "x-hasura-user-id"
          },
          name: {
            type: "sessionVar",
            value: "x-hasura-user-id"
          }
        }
      }
    ]
  },
  {
    name: "Mutation_root",
    children: [
      { name: "set_hello", checked: false },
      {
        name: "user",
        return: "User",
        checked: false,
        args: {
          id: {
            type: "sessionVar",
            value: "x-hasura-user-id"
          },
          name: {
            type: "sessionVar",
            value: "x-hasura-user-id"
          }
        }
      }
    ]
  },
  {
    name: "Subscription_root",
    children: [
      { name: "hello", checked: false },
      {
        name: "user",
        checked: true,
        return: "User",
        args: {
          id: {
            type: "sessionVar",
            value: "x-hasura-user-id"
          },
          name: {
            type: "sessionVar",
            value: "x-hasura-user-id"
          }
        }
      }
    ]
  },
  {
    name: "Type user",
    children: [
      {
        name: "hello"
      },
      { name: "user", return: "User" }
    ]
  }
];

const Tree = ({ list, setState }) => {
  // TODO add checkbox
  // TODO create and sync tree
  // TODO check actual gql schema structure and change, if required
  const [expandedItems, setExpandedItems] = useState({});
  const onCheck = useCallback(
    (ix) => (e) => {
      const newList = [...list];
      newList[ix] = { ...list[ix], checked: e.target.checked };
      setState([...newList]);
    },
    [setState, list]
  );

  const setItem = useCallback(
    (ix) => (newState) => {
      const newList = [...list];
      newList[ix] = { ...newState };
      setState([...newList]);
    },
    [setState, list]
  );
  const setValue = useCallback(
    (ix) => (newState) => {
      const newList = [...list];
      newList[ix] = { ...list[ix], children: [...newState] };
      setState([...newList]);
    },
    [setState, list]
  );
  const toggleExpand = (ix) => (e) => {
    setExpandedItems((expandedItems) => {
      const newState = !expandedItems[ix];
      const newExpandeditems = { ...expandedItems, [ix]: newState };
      return newExpandeditems;
    });
  };
  return (
    <ul>
      {list.map((i, ix) => (
        <li key={i.name}>
          {i.checked !== undefined && (
            <input
              type="checkbox"
              id={i.name}
              name={i.name}
              checked={i.checked}
              onChange={onCheck(ix)}
            />
          )}
          {i.children && (
            <button
              onClick={toggleExpand(ix)}
              style={{
                backgroundColor: "transparent",
                border: 0,
                color: "#0008",
                cursor: "pointer"
              }}
            >
              {expandedItems[ix] ? "-" : "+"}
            </button>
          )}
          <Item i={i} setItem={setItem(ix)} />
          {i.children && expandedItems[ix] && (
            <Tree list={i.children} setState={setValue(ix)} />
          )}
        </li>
      ))}
    </ul>
  );
};

const Item = ({ i, setItem = (e) => console.log(e) }) => {
  const setArg = useCallback(
    (k) => (v) => setItem({ ...i, args: { ...i.args, [k]: v } }),
    [setItem, i]
  );
  return (
    <b>
      <b id={i.name}>{i.name}</b>
      {i.args && " ("}
      {i.args &&
        Object.entries(i.args).map(([k, v]) => (
          <Select {...{ k, v, setArg: setArg(k) }} />
        ))}
      {i.args && " )"}
      {i.return && (
        <>
          : <a href={`#${i.return}`}>{i.return}</a>
        </>
      )}
    </b>
  );
};

const Select = ({ k, v, setArg = (e) => console.log(e) }) => {
  const setArgVal = useCallback((d) => setArg({ ...v, value: d }), [setArg, v]);
  return (
    <>
      <label for={k}> {k}:</label>
      <input
        value={v.value}
        style={{ border: 0, borderBottom: "2px solid #354c9d" }}
        onChange={(e) => setArgVal(e.target.value)}
      />
    </>
  );
};
export default ({ datasource = data }) => {
  const [state, setState] = React.useState(datasource);
  React.useEffect(() => {
    console.log("changed--->", state);
  }, [state]);
  return <Tree list={state} setState={setState} />;
};
