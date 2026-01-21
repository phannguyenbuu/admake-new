import React, {useState} from 'react';
import { usePointer } from '../stores/selectionStore';
import { Space } from 'antd';

const RoomSizeSliders = () => {
  const { roomWidth, setRoomWidth, roomLength, setRoomLength, roomHeight, setRoomHeight } = usePointer();
  
  const handleWidthChange = (e) => setRoomWidth(Number(e.target.value));
  const handleLengthChange = (e) => setRoomLength(Number(e.target.value));
  const handleHeightChange = (e) => setRoomHeight(Number(e.target.value));
  const SLIDER_WIDTH = 150;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20}}>
      {/* Width Slider */}
      <Space direction='horizontal' style={{ width: SLIDER_WIDTH }}>
        <p>Width</p>
        <input
          type="range"
          min="2"
          max="10"
          step="1"
          value={roomWidth}
          onChange={handleWidthChange}
          style={{ width: "100%" }}
        />
        <p>{roomWidth}m</p>
      </Space>

      {/* Length Slider */}
      <Space direction='horizontal' style={{ width: SLIDER_WIDTH }}>
        <p>Length</p>
        <input
          type="range"
          min="2"
          max="10"
          step="1"
          value={roomLength}
          onChange={handleLengthChange}
          style={{ width: "100%" }}
        />
        <p>{roomLength}m</p>
      </Space>

      {/* Height Slider */}
      <Space direction='horizontal' style={{visibility:'hidden', width: SLIDER_WIDTH }}>
        <p>Height</p>
        <input
          type="range"
          min="2"
          max="6"
          step="0.1"
          value={roomHeight}
          onChange={handleHeightChange}
          style={{ width: "100%" }}
        />
        <p>{roomHeight}m</p>
      </Space>
    </div>
  );
};

export default RoomSizeSliders;