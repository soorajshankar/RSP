import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import React, { useCallback, useEffect, useRef, useState } from "react";
import _ from 'lodash'
import Pen from "./Pen";

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
      setfieldVal(oldVal => {
        const newState = {
          ...oldVal, ...vStr
        }
        return newState
      })
    },
    [setItem, i]
  );
  useEffect(() => {
    console.log(fieldVal)
  }, [fieldVal])

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
              <ArgSelect {...{ k, v, value: fieldVal[k], setArg: setArg(k, v), level: 0 }} />
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

const ArgSelect = ({ k, v, value, level, setArg = (e) => console.log(e) }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(value && typeof value === 'string' && value.length > 0);
  const prevState = useRef()
  useEffect(() => {
    if (value && typeof value === 'string' && value.length > 0 && !editMode) {
      // show value instead of pen icon, if the value is defined in the prop
      setEditMode(true)
    }
  }, [value])


  const { children, path } = getChildArgument(v);

  const setArgVal = (val) => {
    const prevVal = prevState.current
    if (prevVal) {
      const newState = _.merge(prevVal, val)
      setArg(newState)
      prevState.current = newState
    } else {
      setArg(val)
      prevState.current = val
    }
  }



  if (children) {
    return (
      <ul style={{ paddingLeft: 0, marginLeft: "-8px" }}>
        <button onClick={() => setExpanded((b) => !b)} style={{}}>
          {expanded ? "-" : "+"}
        </button>
        <label for={k}> {k}:</label>

        {expanded &&
          Object.values(children).map((i) => {
            const childVal = value ? value[i?.name] : undefined
            return (
              <li>
                <ArgSelect
                  {...{
                    k: i.name,
                    setArg: v => setArgVal({ [k]: v }),
                    v: i,
                    value: childVal,
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
      {editMode ? (
        <>
          <input
            value={value}
            style={{ border: 0, borderBottom: "2px solid #354c9d" }}
            onChange={(e) => setArgVal({ [v?.name]: e.target.value })}
          />
        </>
      ) : (
          <button onClick={() => setEditMode(true)}>
            <Pen />
          </button>
        )}
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
