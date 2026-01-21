import React, { useRef, useEffect, useState } from "react";
import PanelFurnitures from "../components/PanelFurnitures";
import { Modal, Tabs } from 'antd';

const { TabPane } = Tabs;

const FurnitureModal = ({ 
  bedroom_furnitures, 
  living_furnitures, 
  addedHighlights,
  groupFurnitures,
  isMB 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('living');

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const tabs = [
    { id: 'living', title: 'LIVING', icon: '/images/sofa.svg' },
    { id: 'bedroom', title: 'BEDROOM', icon: '/images/bed.svg' },
    ...(addedHighlights?.length ? [{ id: 'cart', title: 'CART/IN-USED', icon: '/images/cart.svg' }] : [])
  ];

  const tabContent = {
    living: living_furnitures,
    bedroom: bedroom_furnitures,
    cart: groupFurnitures(addedHighlights.map(el => el.data))
  };

  return (
    <>
      {/* Nút nhỏ trigger modal */}
      <div 
        style={{
          position: 'fixed',
          top: 20,
          
          left: isMB() ? 20 : 20,
          zIndex: 999,
          cursor: 'pointer'
        }}
        onClick={showModal}
      >
        <img 
          src="/images/logo-fureal2-1.png" 
          style={{ width: 40, height: 40 }} 
          alt="Menu"
        />
      </div>

      <Modal
        title={
          <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', }}>
            Furniture Panels
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}  // Ẩn footer mặc định
        width={isMB() ? '95vw' : 800}
        style={{ top: 20, minWidth: '90vw' }}
        bodyStyle={{ padding: '0', height: '70vh' }}
      >
          <div>
            {/* Tab Headers */}
            <div style={{ display: 'flex', background: '#f8f9fa', padding: '12px' }}>
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: 8,
                    background: activeTab === tab.id ? 'white' : 'transparent',
                    boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <img src={tab.icon} style={{ width: 24, height: 24 }} alt={tab.title} />
                  <span style={{ fontSize: 12, fontWeight: activeTab === tab.id ? 'bold' : 'normal' }}>
                    {tab.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <PanelFurnitures 
                furnitures={tabContent[activeTab]} 
                title={tabs.find(t => t.id === activeTab)?.title}
              />
            </div>
          </div>
        </Modal>
      
    </>
  );
};

export default FurnitureModal;