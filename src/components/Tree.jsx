import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import React, { useCallback, useState } from "react";
import { setDeep } from "../utils";

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

const Tree = ({ list, setState, schema }) => {
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
            <button onClick={toggleExpand(ix)}>
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
      <ul>
        {i.args &&
          Object.entries(i.args).map(([k, v]) => (
            <li>
              <Select {...{ k, v, setArg: setArg(k) }} />
            </li>
          ))}
      </ul>
      <ul>
        {i.args && " )"}
        {i.return && (
          <>
            :
            <a href={`#type_${i.return.replace(/[^\w\s]/gi, "")}`}>
              {i.return}
            </a>
          </>
        )}
      </ul>
    </b>
  );
};

const getChildArgument = (v) => {
  if(typeof v==='string') return ({children:null});// value field
  if (v?.type instanceof GraphQLInputObjectType &&v?.type?.getFields) return {children:v?.type?.getFields(),path:'type._fields'};
  if(v?.type instanceof GraphQLNonNull||v?.type?.ofType){
    return {children:v?.type?.ofType?._fields,path:'type.ofType._fields'};
  }
  return {}
};

const Select = ({ k, v, setArg = (e) => console.log(e) }) => {
  const [expanded, setExpanded] = useState(false);
  const setArgVal = useCallback((d) => setArg({ ...v, value: d }), [setArg, v]);
  console.log({ k,v });
  const {children,path} = getChildArgument(v);
  console.log({ children,path });

  if (children) {
    // if (v?.name === "where") console.log(">>>", Object.values(children));
    // const onChange=name=>value=>{
    //   console.log('name,value,children')
    //   const pathArr=`${path}.${name}.value`.split('.')
    //   console.log({name,value,pathArr,children,k,v})
    //   const newV=setDeep(v,pathArr,""+value.value,true);
    //   console.log('VVV',newV)
    //   // setArg({...children,[name]:value})
    // }
    return (
      <ul>
        <button onClick={() => setExpanded((b) => !b)} style={{}}>
          {expanded ? "-" : "+"}
        </button>
        <label for={k}> {k}:</label>

        {expanded &&
          Object.values(children).map((i) => {
            return (
              <li>
                <Select {...{ k: i.name, v: i, setArg}} />
              </li>
            );
          })}
      </ul>
    );
  }
  return (
    <li>
      <label for={k}> {k}:</label>
      <input
        value={v?.value}
        style={{ border: 0, borderBottom: "2px solid #354c9d" }}
        onChange={(e) => setArgVal(e.target.value)}
      />
      ,
    </li>
  );
};
export default ({ datasource = data, schema }) => {
  const [state, setState] = React.useState(datasource);
  React.useEffect(() => {
    console.log("changed--->", state);
  }, [state]);
  return (
    <div className="tree">
      <Tree list={state} setState={setState} schema={schema} />
    </div>
  );
};
