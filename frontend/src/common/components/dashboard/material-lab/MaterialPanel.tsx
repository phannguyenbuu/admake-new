import React, { useState } from 'react';
import { MATERIAL_PRESETS } from './materialsData';
import { 
  Sparkles, 
  RotateCw, 
  Sliders, 
  Sun, 
  Box, 
  Grid, 
  Activity, 
  Globe, 
  Palette,
  Settings
} from 'lucide-react';

interface MaterialPanelProps {
  selectedMaterialId: string;
  onSelectMaterial: (id: string) => void;
  materialProps?: any;
  selectedLightingPreset: string;
  onSelectLightingPreset: (preset: string) => void;
  autoRotateSpeed: number;
  onSetAutoRotateSpeed: (speed: number) => void;
  lightOrbitSpeed: number;
  onSetLightOrbitSpeed: (speed: number) => void;
  showWireframe: boolean;
  onSetShowWireframe: (show: boolean) => void;
  modelType: 'geosphere' | 'torusknot' | 'reactor';
  onSetModelType: (type: 'geosphere' | 'torusknot' | 'reactor') => void;
  isGlowPulseActive: boolean;
  onSetGlowPulseActive: (active: boolean) => void;
  backgroundColor: string;
  onSetBackgroundColor: (color: string) => void;
}

/** Map material IDs → texture filenames for preview thumbnails */
const TEXTURE_PREVIEWS: Record<string, string> = {
  // Indoor
  lumion_fabric: 'fabric_sofa.webp',
  lumion_leather: 'leather_diffuse.webp',
  lumion_indoor_wood: 'wood_clara_beige.webp',
  lumion_indoor_stone: 'marble_grey.webp',
  lumion_tiles: 'tile_bianco.webp',
  lumion_plaster: 'plaster_detail.webp',
  lumion_carpet: 'fabric_carpet.webp',
  lumion_parquet: 'wood_parquet.webp',
  lumion_walnut: 'wood_walnut_dark.webp',
  lumion_ceramic: 'tile_venato.webp',
  lumion_chrome: 'metal_steel.webp',
  // Outdoor
  lumion_asphalt: 'asphalt_pave.webp',
  lumion_brick: 'brick_red.webp',
  lumion_concrete: 'concrete_rough.webp',
  lumion_outdoor_metal: 'metal_steel.webp',
  lumion_outdoor_plaster: 'concrete_dark.webp',
  lumion_roofing: 'roof_red.webp',
  lumion_outdoor_stone: 'brick_natural.webp',
  lumion_outdoor_wood: 'wood_plank.webp',
  lumion_cobblestone: 'asphalt_pave.webp',
  lumion_granite: 'marble_grey.webp',
  lumion_corten: 'metal_rust.webp',
  lumion_slate_roof: 'roof_blue.webp',
  lumion_stucco: 'metal_galvanized.webp',
  // Nature
  lumion_3d_grass: 'nature_grass.webp',
  lumion_leaves: 'nature_leaves.webp',
  lumion_rock: 'concrete_dark.webp',
  lumion_soil: 'asphalt_road.webp',
  lumion_moss: 'nature_leaves.webp',
  lumion_gravel: 'concrete_dark.webp',
  lumion_bark: 'wood_plank.webp',
  lumion_fur: 'fabric_modern_carpet.webp',
  // Custom
  lumion_landscape: 'nature_grass.webp',
};

export const MaterialPanel: React.FC<MaterialPanelProps> = ({
  selectedMaterialId,
  onSelectMaterial,
  materialProps,
  selectedLightingPreset,
  onSelectLightingPreset,
  autoRotateSpeed,
  onSetAutoRotateSpeed,
  lightOrbitSpeed,
  onSetLightOrbitSpeed,
  showWireframe,
  onSetShowWireframe,
  modelType,
  onSetModelType,
  isGlowPulseActive,
  onSetGlowPulseActive,
  backgroundColor,
  onSetBackgroundColor,
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'settings'>('materials');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Tất Cả' },
    { id: 'custom', label: 'Custom' },
    { id: 'indoor', label: 'Indoor' },
    { id: 'outdoor', label: 'Outdoor' },
    { id: 'nature', label: 'Nature' },
  ];

  const baseMaterials = activeCategory === 'all'
    ? MATERIAL_PRESETS
    : MATERIAL_PRESETS.filter(m => m.category === activeCategory);

  const filteredMaterials = [...baseMaterials];
  if (materialProps && (activeCategory === 'all' || activeCategory === 'custom')) {
    filteredMaterials.unshift({
      id: 'custom_shader',
      name: 'Vật liệu vật tư',
      category: 'custom' as any,
      description: 'Vật liệu 3D tùy chỉnh theo thông số trong database vật tư.',
      color: materialProps.diffuse || '#ffd700',
      tags: ['Custom DB']
    });
  }

  // Define lighting profiles
  const lightingProfiles = [
    { id: 'studio', name: 'Studio Pro', desc: 'Trắng trung tính', color: 'bg-stone-400' },
    { id: 'neon', name: 'Cyber Neon', desc: 'Hồng & Xanh lam', color: 'bg-pink-500' },
    { id: 'solar', name: 'Solar Flare', desc: 'Lửa Mặt Trời', color: 'bg-amber-500' },
    { id: 'toxic', name: 'Toxic Yellow', desc: 'Uranium phát xạ', color: 'bg-lime-500' },
    { id: 'frozen', name: 'Glacial Ice', desc: 'Băng tuyết cực âm', color: 'bg-cyan-400' },
    { id: 'abyss', name: 'Dark Void', desc: 'Tím huyền ảo', color: 'bg-purple-600' },
  ];

  return (
    <div className="w-full flex flex-col gap-3 text-gray-700">
      
      {/* TAB HEADER — Light theme */}
      <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-xl gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-white text-emerald-600 border border-gray-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kho Chất Liệu</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white text-blue-600 border border-gray-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Cài đặt</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="flex flex-col">

        {/* TAB 1: MATERIALS */}
        {activeTab === 'materials' && (
          <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl p-3 gap-3">
            {/* Header */}
            <div className="space-y-2">

              {/* Filtering buttons */}
              <div className="flex flex-wrap gap-1 pb-2 border-b border-gray-100">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`py-1 px-2 text-[10px] rounded font-medium transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable preset list */}
            <div className="grid grid-cols-1 gap-1.5 overflow-y-auto max-h-[320px] pr-1">
              {filteredMaterials.map((preset) => {
                const isSelected = selectedMaterialId === preset.id;
                const tex = TEXTURE_PREVIEWS[preset.id];
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectMaterial(preset.id)}
                    className={`flex gap-2.5 text-left p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 shadow-md'
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    {/* Texture preview or color swatch */}
                    {tex ? (
                      <img
                        src={`/textures/${tex}`}
                        alt={preset.name}
                        className={`w-9 h-9 rounded-lg shrink-0 object-cover ${isSelected ? 'border-2 border-white/40' : 'border border-gray-200'}`}
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-lg shrink-0 shadow-inner ${isSelected ? 'border-2 border-white/40' : 'border border-gray-200'}`}
                        style={{ backgroundColor: preset.color }}
                      />
                    )}

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>{preset.name}</span>
                        <span className={`text-[8px] uppercase font-mono px-1 rounded shrink-0 ml-1 ${isSelected ? 'bg-teal-500 text-white/80' : 'bg-gray-100 text-gray-400'}`}>
                          {preset.category}
                        </span>
                      </div>
                      <p className={`text-[9px] line-clamp-1 ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>{preset.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SETTINGS (Geometry + Lighting + Controls merged) */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col gap-3">

            {/* Mô hình 3D */}
            <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                <Box className="w-3.5 h-3.5" />
                <span>Mô Hình 3D</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'geosphere', label: 'Sphere', icon: <Globe className="w-3 h-3" /> },
                  { id: 'torusknot', label: 'Knot', icon: <Sparkles className="w-3 h-3" /> },
                  { id: 'reactor', label: 'Ring', icon: <RotateCw className="w-3 h-3" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSetModelType(item.id as any)}
                    className={`flex items-center justify-center gap-1 py-2 px-2 text-[10px] rounded-lg font-medium transition-all cursor-pointer ${
                      modelType === item.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ánh sáng */}
            <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                <Sun className="w-3.5 h-3.5" />
                <span>Ánh sáng</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {lightingProfiles.map((profile) => {
                  const isSelected = selectedLightingPreset === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => onSelectLightingPreset(profile.id)}
                      className={`relative flex items-center gap-2 text-left p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-amber-300 bg-amber-50 shadow-sm'
                          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${profile.color}`} />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-700 block truncate">{profile.name}</span>
                        <span className="text-[8px] text-gray-400 block truncate">{profile.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Điều khiển */}
            <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                <Sliders className="w-3.5 h-3.5" />
                <span>Điều khiển</span>
              </div>

              {/* Auto rotate speed */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 text-blue-500" /> Tốc độ xoay</span>
                  <span className="font-mono text-blue-600 font-bold">{autoRotateSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.2"
                  value={autoRotateSpeed}
                  onChange={(e) => onSetAutoRotateSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>


            </div>

            {/* Màu nền */}
            <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                <Palette className="w-3.5 h-3.5" />
                <span>Màu nền</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'white', name: 'Trắng', value: '#f5f5f5' },
                  { id: 'light', name: 'Sáng', value: '#e0e0e0' },
                  { id: 'dark', name: 'Tối', value: '#1a1a2e' },
                  { id: 'black', name: 'Đen', value: '#000000' },
                ].map((preset) => {
                  const isActive = backgroundColor.toLowerCase() === preset.value.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onSetBackgroundColor(preset.value)}
                      className={`flex flex-col items-center justify-center py-1.5 px-1 text-[9px] rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 rounded-full border border-gray-300 mb-1" 
                        style={{ backgroundColor: preset.value }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom color picker */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-gray-200 cursor-pointer">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => onSetBackgroundColor(e.target.value)}
                    className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer bg-transparent scale-150"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Hex</div>
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => onSetBackgroundColor(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-[11px] font-bold font-mono text-gray-700 focus:outline-none focus:ring-0"
                    placeholder="#f5f5f5"
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
