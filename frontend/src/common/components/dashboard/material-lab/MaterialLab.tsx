/**
 * MaterialLab — 3D Material Viewer embedded widget
 * Scene is created ONCE and never destroyed. Material changes are hot-swapped.
 */
import { useState, useEffect, useCallback, memo, useDeferredValue } from 'react';
import { ThreeCanvasMemo } from './ThreeCanvas';
import { MATERIAL_PRESETS } from './materialsData';

interface MaterialLabProps {
  initialMaterialId?: string;
  onSaveMaterial?: (materialId: string) => void;
  materialProps?: any;
}

function MaterialLabInner({ initialMaterialId = 'lumion_standard', onSaveMaterial, materialProps }: MaterialLabProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(initialMaterialId);
  const [selectedLightingPreset, setSelectedLightingPreset] = useState<string>('studio');
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(1.2);
  const [lightOrbitSpeed, setLightOrbitSpeed] = useState<number>(1.5);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [modelType, setModelType] = useState<'geosphere' | 'torusknot' | 'reactor'>('geosphere');
  const [isGlowPulseActive, setGlowPulseActive] = useState<boolean>(true);
  const [backgroundColor, setBackgroundColor] = useState<string>('#999999');

  // Sync when parent changes the item (different preview item selected)
  useEffect(() => {
    setSelectedMaterialId(initialMaterialId);
  }, [initialMaterialId]);

  const selectedMaterial = selectedMaterialId === 'custom_shader' && materialProps
    ? {
        id: 'custom_shader',
        name: materialProps.name || 'Vật liệu vật tư',
        category: 'custom' as const,
        description: materialProps.technical_notes || materialProps.note || 'Vật liệu 3D tùy chỉnh theo thông số trong database vật tư.',
        color: materialProps.diffuse || '#ffd700',
        tags: [materialProps.sku || 'Custom']
      }
    : MATERIAL_PRESETS.find(m => m.id === selectedMaterialId);
    
  const isDirty = selectedMaterialId !== initialMaterialId;

  // Defer the material ID and props for Three.js — table/UI stays responsive
  const deferredMaterialId = useDeferredValue(selectedMaterialId);
  const deferredMaterialProps = useDeferredValue(materialProps);

  const handleSave = useCallback(() => {
    onSaveMaterial?.(selectedMaterialId);
  }, [onSaveMaterial, selectedMaterialId]);

  return (
    <div className="w-full flex flex-col gap-3 relative z-10" style={{ maxWidth: 380 }}>

      {/* 3D VIEWPORT — never unmounted */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/10">
        <ThreeCanvasMemo
          materialId={deferredMaterialId}
          materialProps={deferredMaterialProps}
          lightingPreset={selectedLightingPreset}
          autoRotateSpeed={autoRotateSpeed}
          lightOrbitSpeed={lightOrbitSpeed}
          showWireframe={showWireframe}
          modelType={modelType}
          isGlowPulseActive={isGlowPulseActive}
          backgroundColor={backgroundColor}
        />

        {/* Floating material info overlay */}
        {selectedMaterial && (
          <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-slate-950/75 backdrop-blur-md border border-white/5 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-[11px] font-bold text-white truncate">{selectedMaterial.name}</h4>
              <p className="text-[8px] text-gray-400 leading-snug line-clamp-2">{selectedMaterial.description}</p>
            </div>
            {isDirty && (
              <button
                onClick={handleSave}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold transition-colors shadow-lg shadow-teal-500/30"
              >
                Cập nhật
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const MaterialLab = memo(MaterialLabInner);
export default MaterialLab;
