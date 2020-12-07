import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import _ from "lodash";
import Pen from "./Pen";
import { generateSDL, getChildArgument } from "../utils";

const RootContext = createContext();

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
          <Field i={i} setItem={setItem(ix)} key={i.name} />
          {i.children && expandedItems[ix] && (
            <Tree list={i.children} setState={setValue(ix)} />
          )}
        </li>
      ))}
    </ul>
  );
};
const CollapsedField = ({ field: i, onClick }) => (
  <>
    <b id={i.name}>{i.name}</b>
    {i.return && (
      <b>
        :
        <a
          onClick={onClick}
          id={`${i.return.replace(/[^\w\s]/gi, "")}`}
          href={`${i.return.replace(/[^\w\s]/gi, "")}`}
        >
          {i.return}
        </a>
      </b>
    )}
  </>
);

const Field = ({ i, setItem = (e) => console.log(e) }) => {
  const [fieldVal, setfieldVal] = useState({});
  const setArg = useCallback(
    (k, v) => (vStr) => {
      setfieldVal((oldVal) => {
        const newState = {
          ...oldVal,
          ...vStr
        };
        return newState;
      });
    },
    [setItem, i]
  );
  const cntxt = useContext(RootContext);
  useEffect(() => {
    if (fieldVal && fieldVal !== {} && Object.keys(fieldVal).length > 0) {
      cntxt.setArgTree((argTree) => {
        return { ...argTree, [i.name]: fieldVal };
      });
    }
  }, [fieldVal]);

  const handleClick = (e) => {
    e.preventDefault();
    const selectedTypeName = e.target.id;
    const selectedUrl = e.target.href;
    console.log("selected url: ", selectedUrl);
  };

  if (!i.checked) return <CollapsedField field={i} onClick={handleClick} />;
  return (
    <b>
      <b id={i.name}>{i.name}</b>
      {i.args && " ("}
      <ul>
        {i.args &&
          Object.entries(i.args).map(([k, v]) => (
            <ArgSelect
              {...{
                key: k,
                k,
                v,
                value: fieldVal[k],
                setArg: setArg(k, v),
                level: 0
              }}
            />
          ))}
      </ul>
      <ul>
        {i.args && " )"}
        {i.return && (
          <>
            :
            <a
              onClick={handleClick}
              id={`${i.return.replace(/[^\w\s]/gi, "")}`}
              href={`${i.return.replace(/[^\w\s]/gi, "")}`}
            >
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
  const [editMode, setEditMode] = useState(
    value && value.__v && typeof value.__v === "string" && value.__v.length > 0
  );
  const prevState = useRef();
  useEffect(() => {
    if (value && typeof value === "string" && value.length > 0 && !editMode) {
      // show value instead of pen icon, if the value is defined in the prop
      setEditMode(true);
    }
  }, [value]);

  const { children, path } = getChildArgument(v);

  const setArgVal = (val) => {
    const prevVal = prevState.current;
    if (prevVal) {
      const newState = _.merge(prevVal, val);
      setArg(newState);
      prevState.current = newState;
    } else {
      setArg(val);
      prevState.current = val;
    }
  };

  const toggleExpandMode = () => setExpanded((b) => !b);

  if (children) {
    return (
      <ul style={{ paddingLeft: 0, marginLeft: "-4px" }}>
        <button onClick={toggleExpandMode} style={{}}>
          {expanded ? "-" : "+"}
        </button>
        {level === 0 && <input
          type="checkbox"
          onChange={(e) => setArgVal({ [v?.name]: { __checked: e.target.checked } })}
        />}
        <label
          style={{ cursor: "pointer" }}
          htmlFor={k}
          onClick={toggleExpandMode}
        >
          {" "}
          {k}:
        </label>

        {expanded &&
          Object.values(children).map((i) => {
            const childVal = value ? value[i?.name] : undefined;
            return (
              <li>
                <ArgSelect
                  {...{
                    k: i.name,
                    setArg: (v) => {
                      let newState
                      if (level === 0) newState = { [k]: { __v: v, ...(v?.__checked && { __checked: true }) } }
                      else newState = { [k]: v }
                      setArgVal(newState)
                    },
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
      {level === 0 && <input
        type="checkbox"
        // onChange={onCheck(ix)}
        onChange={(e) => setArgVal({ [v?.name]: { __checked: e.target.checked } })}
      />}
      <label htmlFor={k}> {k}:</label>
      {editMode ? (
        <>
          <input
            value={value?.__v}
            style={{ border: 0, borderBottom: "2px solid #354c9d" }}
            onChange={(e) => {
              // TODO Cleanup
              let newState;
              if (level === 0) newState = { [v?.name]: { __v: e.target.value } }
              else newState = { [v?.name]: e.target.value }
              setArgVal(newState)
            }}
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

const TreeRoot = ({ datasource, schema, setDatasource }) => {
  const [state, setState] = React.useState(datasource); //TODO - low priority:  a copy of datasource, could be able to remove this after evaluation
  const [argTree, setArgTree] = React.useState({}); // all @presets as an object tree
  const [resultString, setResultString] = React.useState(""); // Generated SDL

  useEffect(() => {
    console.log("changed--->", state);
    if (!state) return;
    // TODO make this a utility
    setResultString(generateSDL(state, argTree));
  }, [state, argTree]);

  useEffect(() => {
    setState(datasource);
  }, [datasource]);

  return (
    <div className="tree">
      <RootContext.Provider
        value={{ argTree, setArgTree, schema, setDatasource }}
      >
        <Tree list={state} setState={setState} schema={schema} />
        <code style={{ whiteSpace: "pre-wrap" }}>{resultString}</code>
      </RootContext.Provider>
    </div>
  );
};

export default TreeRoot;
