import React, { useEffect, useState } from 'react';
import './WorkspaceConfig.css';
import { Space } from 'antd';
import MaterialPanel from './MaterialPanel';
import FiveOptionToggle from './FiveOptionToggle';
import RoomDoorSlider from './RoomDoorSlider';
import { RoomAxisSlider } from './ModifyControl';
import RoomSizeSliders from './RoomSizeSliders';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { useSelection } from '../stores/selectionStore';
import CartInUsePanel from './CartInUse';
import ModelSelectSwatch from './ModelSelectSwatch';
import libraryData from "../json/modelLibrary.json"; // ✅ JSON config rooms

const WorkspaceConfig = () => {
  const [selectedModels, setSelectedModels] = useState({}); // {roomId: selectedModel}

  // ✅ Lấy config từ JSON
  // Trong WorkspaceConfig
  const [rooms, setRooms] = useState([]);


  const BASE_URL = 'https://n-lux.com/creative/json';

  useEffect(() => {
    const loadRooms = async () => {
      const loadedRooms = await Promise.all(
        libraryData.map(async (roomMeta) => {
          // ✅ Dùng fetch thay dynamic import
          const url = `${BASE_URL}/${roomMeta.path}`;
          const response = await fetch(url);
          const rawModels = await response.json();
          
          return {
            ...roomMeta,
            models: rawModels.map((model, i) => ({
              id: `${roomMeta.activeRoom}_${i}`,
              roomId: roomMeta.activeRoom,
              ...model
            }))
          };
        })
      );
      setRooms(loadedRooms);
    };
    
    loadRooms();
  }, []);





  // const activeRoom = libraryData.activeRoom || 'living';

  // Callback add furniture
  const addFurniture = (model, roomKey) => {
    setSelectedModels(prev => ({ ...prev, [roomKey]: model }));
    // Logic thêm vào scene/store
  };

  return (
    <div className="configurator-container">
      {/* 3D Scene */}
      

      {/* Top Left: RoomSize */}
      <div className="panel panel-top-left">
        <h3>RoomSize</h3>

        <Space direction="horizontal">
          <a href="https://www.n-lux.com" target="_blank" rel="noopener noreferrer">
            <img src={`https://www.n-lux.com/logos/logo-fureal2-1.png`} alt="Fureal Logo" style={{width:100,height:'auto'}}/>
          </a>
        
          <Space direction='vertical'>
            <div style={{marginTop: -40}}>
              <RoomSizeSliders />
            </div>
            <div style={{marginTop: -30}}>
              <RoomDoorSlider />
            </div>
          </Space>

        </Space>
      </div>

      {/* Middle Bottom: Dynamic Room Swatches */}
      <div className="panel panel-middle-bottom">
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',  // 5 cột đều
          gridTemplateRows: 'repeat(2, auto)',     // 2 hàng
          gap: '6px',
          justifyContent: 'center',
          maxWidth: '800px',  // Giới hạn max width
          margin: '0px auto', // Center + margin top
          padding: '0 20px'
        }}>
          {rooms.map(room => (
            <ModelSelectSwatch
              key={room.activeRoom}
              label={room.label}
              models={room.models}
              selectedModel={selectedModels[room.activeRoom]}
              onSelectModel={(model) => addFurniture(model, room.activeRoom)}
              gradient={room.gradient}
            />
          ))}
        </div>
      </div>

      {/* Top Right: Cart */}
      <div className="panel panel-top-right">
        <div className="panel-content">
          <h3>Cart</h3>
          <CartInUsePanel />
        </div>
      </div>

      {/* Bottom Right: Actions */}
      <div className="panel panel-bottom-right">
        <Space direction='vertical'>
          <button className="save-btn">Save Config</button>
          <button className="share-btn">Share</button>
        </Space>
      </div>

      {/* Middle Top: Material */}
      <div className="panel panel-middle-top">
        <div className="panel-content">
          <h3>Room Material</h3>
          <MaterialPanel />
        </div>
      </div>

      <FengshuiPanel />
    </div>
  );
};

export default WorkspaceConfig;

const FengshuiPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const { message } = useSelection();

  useEffect(() => {
    if (message && message.trim()) {
      setShowPanel(true);
      setIsExpanded(true);
    }
  }, [message]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const formatMessage = (msg) => {
    if (!msg) return '';
    
    return msg
      .split('|')                    // Tách theo |
      .map(line => `• ${line.trim()}`) // Thêm bullet
      .join('\n');                   // Xuống dòng
  };

  return (
    <div className={`panel panel-left-bottom ${isExpanded ? 'expanded' : 'collapsed'} ${showPanel ? 'show' : 'hide'}`}>
      {/* ✅ HEADER LUÔN Ở ĐẦU */}
      <Space direction='horizontal'>        
        
        <button className="expand-btn" onClick={toggleExpand}>
          {!isExpanded ? <CaretUpOutlined style={{fontSize: '30px'}} /> : <CaretDownOutlined style={{fontSize: '30px'}} />}
        </button>
        <h3 style={{margin: 0}}>Fengshui</h3>
      </Space>

      
      {/* ✅ TEXTAREA LÊN ĐẦU khi EXPANDED */}
      {isExpanded && (
          <div style={{padding: '0 20px 12px'}}>
            <textarea 
              value={formatMessage(message)}
              readOnly
              style={{
                width: '100%', height: '160px', 
                fontSize: 14, 
                border: 'none', 
                resize: 'none',
                background: 'none',
                lineHeight: '1.5'
              }}
              placeholder="Phong thủy analysis..."
            />
          </div>
      )}

      {/* Controls - luôn hiện */}
      <div className="controls-section">
        <Space direction='vertical' style={{marginTop: -12, width: '100%'}}>
          <FiveOptionToggle />
          <div style={{marginTop: -20}}>
            <RoomAxisSlider />
          </div>
        </Space>
      </div>
    </div>
  );
};
