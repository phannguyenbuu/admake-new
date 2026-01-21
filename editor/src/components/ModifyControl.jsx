import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";

import { useSelection, usePointer } from "../stores/selectionStore";

const btnStyle = {
  width: 60,
  height: 60,
  background: "rgba(255,255,255,0.75)",
  display: "flex",
  flexDirection: "row",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function ModifyControls() {
  const { rotateLeft, rotateRight, getResult, deletePointerId } = usePointer();
  const { currentSelection, setMessage } = useSelection();
  const imgStyle = { width: 30, height: 30 };

  const rotateCW = () => {
    rotateLeft(currentSelection);
    setMessage(getResult());
  };

  const rotateCCW = () => {
    rotateRight(currentSelection);
    setMessage(getResult());
  };

  const handleDelete = () => {
    deletePointerId(currentSelection);
  };

  const nodeRef = useRef(null);

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle">
      <div ref={nodeRef} style={{ position: "fixed", top: 300, right: 20 }}>
        <div className="drag-handle" style={{ width: 50, cursor: "move" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: 20 }}>
          <button style={btnStyle} onClick={rotateCW}>
            <img src="/images/rotation-icon-left.png" style={imgStyle} alt="Rotate CW" />
          </button>

          <button style={btnStyle} onClick={rotateCCW}>
            <img src="/images/rotation-icon.png" style={imgStyle} alt="Rotate CCW" />
          </button>

          <button style={btnStyle} onClick={handleDelete}>
            <img src="/images/delete.png" style={imgStyle} alt="Delete" />
          </button>
        </div>
      </div>
    </Draggable>
  );
}

export default ModifyControls;

export function RoomAxisSlider() {
  const { directionAxis, setDirectionAxis, getResult } = usePointer();
  const { setMessage } = useSelection();
  const [value, setValue] = useState(directionAxis);

  const handleChange = (event) => {
    setValue(parseInt(event.target.value, 10));
  };

  useEffect(() => {
    setDirectionAxis(value);
  }, [setDirectionAxis, value]);

  useEffect(() => {
    setMessage(getResult());
  }, [directionAxis, getResult, setMessage]);

  return (
    <div style={{ width: 150, display: "flex", flexDirection: "row" }}>
      <input
        type="range"
        min="1"
        max="360"
        value={value}
        onChange={handleChange}
        style={{ width: "100%" }}
      />
      <div style={{ textAlign: "left", marginTop: 10, whiteSpace: "nowrap", fontSize: 14 }}>
        Axis: {value}Aų
      </div>
    </div>
  );
}
