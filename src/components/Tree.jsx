import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { setDeep } from "../utils";

const getChildArgument = (v) => {
  if (typeof v === "string") return { children: null }; // value field
  if (v?.type instanceof GraphQLInputObjectType && v?.type?.getFields)
    return { children: v?.type?.getFields(), path: "type._fields" };
  if (v?.type instanceof GraphQLNonNull || v?.type?.ofType) {
    return { children: v?.type?.ofType?._fields, path: "type.ofType._fields" };
  }
  return {};
};

const Tree = ({ list, setState, schema }) => {
  // TODO add checkbox
  // TODO create and sync tree
  // TODO check actual gql schema structure and change, if required
  const [expandedItems, setExpandedItems] = useState({});
  const [values, setValues] = useState({});
  useEffect(() => {
    setValues(list.filter((i) => i.checked));
  }, [list]);
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
          <Field i={i} setItem={setItem(ix)} />
          {i.children && expandedItems[ix] && (
            <Tree list={i.children} setState={setValue(ix)} />
          )}
        </li>
      ))}
    </ul>
  );
};

const Field = ({ i, setItem = (e) => console.log(e) }) => {
  const [fieldVal, setfieldVal] = useState({});
  const setArg = useCallback(
    (k, v) => (vStr) => {
      console.log(">>>");
      console.log({ k, v, vStr });
      // setfieldVal({ ...i, args: { ...i.args, [k]: v } })
    },
    [setItem, i]
  );

  if (!i.checked)
    return (
      <>
        <b id={i.name}>{i.name}</b>
        {i.return && (
          <b>
            :
            <a href={`#type_${i.return.replace(/[^\w\s]/gi, "")}`}>
              {i.return}
            </a>
          </b>
        )}
      </>
    );
  return (
    <b>
      <b id={i.name}>{i.name}</b>
      {i.args && " ("}
      <ul>
        {i.args &&
          Object.entries(i.args).map(([k, v]) => (
            <li>
              <ArgSelect {...{ k, v, setArg: setArg(k, v), level: 0 }} />
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

const ArgSelect = ({ k, v, level, setArg = (e) => console.log(e) }) => {
  const [expanded, setExpanded] = useState(false);
  const [argVal, setArgVal] = useState(null);
  const prevState = useRef();
  useEffect(() => {
    if (!argVal) return;
    if (level > 0) {
      if (typeof argVal === "string") return setArg({ [k]: argVal });
      console.log(">>><", prevState?.current, argVal);
      console.log({ ...argVal, ...prevState?.current });

      setArg({ [k]: { ...prevState?.current, ...argVal } });
      prevState.current = { ...prevState?.current, ...argVal };
      return;
    }
    console.log("????", v?.type?.name);
    // TODO change case of GQL type
    const valueStr = `${k} : ${v?.type?.name} @preset(value: ${JSON.stringify(
      argVal
    )})`;

    setArg(valueStr);
    // console.log(">>",level,{[k]:argVal});
  }, [argVal, k, setArg, level, v]);
  // const setArgVal = useCallback((d) => setArg({ ...v, value: d }), [setArg, v]);
  const { children, path } = getChildArgument(v);
  // console.log({ children,path });

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
                <ArgSelect
                  {...{
                    k: i.name,
                    setArg: setArgVal,
                    v: i,
                    level: level + 1
                  }}
                />
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
export default ({ datasource, schema }) => {
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
