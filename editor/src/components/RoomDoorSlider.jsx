import React, { useState, useEffect } from 'react';
import { usePointer } from '../stores/selectionStore';

function RoomDoorSlider() {
  const [sliderValue, setSliderValue] = useState(0);
  const {roomWidth, roomLength, roomDoor, setRoomDoor} = usePointer();
  
   useEffect(() => {
    if (roomDoor !== sliderValue) {
      setSliderValue(roomDoor);
    }
  }, [roomDoor]);

  const onSliderChange = (value) => {
    setSliderValue(value);
    setRoomDoor(value);
  };

  return (
    <div style={{ width: 120 }}>
      <input
        style={{ width: '100%' }}
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={sliderValue}
        onChange={e => onSliderChange(parseFloat(e.target.value))}
      />
      <p>Vị trí cửa đi</p>
      
    </div>
  );
}

export default RoomDoorSlider;
