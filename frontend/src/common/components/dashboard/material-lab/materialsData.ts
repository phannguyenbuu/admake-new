/**
 * materialsData.ts — Re-export barrel
 *
 * File này giữ nguyên để backward-compatible với toàn bộ import cũ.
 * Logic thực tế đã được tách ra:
 *   - materialPresets.ts  → MATERIAL_PRESETS + MaterialPreset interface
 *   - materialFactory.ts  → createThreeMaterial() + UpdatableMaterial interface
 */

export type { MaterialPreset } from './materialPresets';
export { MATERIAL_PRESETS } from './materialPresets';

export type { UpdatableMaterial } from './materialFactory';
export { createThreeMaterial } from './materialFactory';
