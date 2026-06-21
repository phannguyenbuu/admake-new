/**
 * Lumion Material Library Presets & Three.js Shader Factories
 * Supporting PBR and fully dynamic real-time rendering.
 * Now with REAL texture maps from local texture library.
 */

import * as THREE from 'three';
import * as Procedural from './proceduralTextures';
import { loadTexture, loadBumpTexture } from './textureLoader';

export interface MaterialPreset {
  id: string;
  name: string;
  category: 'custom' | 'indoor' | 'outdoor' | 'nature';
  description: string;
  color: string; // Tailwind hex representation for visual dots
  tags: string[];
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  // --- 1. GROUP: CUSTOM (Vật liệu tùy chỉnh & Tiện ích) ---
  {
    id: 'lumion_standard',
    name: 'Standard (Tiêu chuẩn)',
    category: 'custom',
    description: 'Vật liệu PBR vạn năng tiêu chuẩn của Lumion với độ nhám và phản chiếu cân bằng.',
    color: '#A0AEC0',
    tags: ['PBR', 'Vạn Năng', 'Phản Chiếu']
  },
  {
    id: 'lumion_color',
    name: 'Color (Màu sắc)',
    category: 'custom',
    description: 'Vật liệu sơn màu phủ bóng (Clearcoat) chất lượng cao, phản xạ môi trường chân thực.',
    color: '#E53E3E',
    tags: ['Sơn Glossy', 'Màu Sắc', 'Clearcoat']
  },
  {
    id: 'lumion_glass',
    name: 'Glass (Kính)',
    category: 'custom',
    description: 'Kính tiêu chuẩn, truyền dẫn ánh sáng vật lý hoàn hảo (Refraction Index 1.52).',
    color: '#E2E8F0',
    tags: ['Khúc Xạ', 'Trong Suốt', 'Glow Edge']
  },
  {
    id: 'lumion_water',
    name: 'Water (Nước)',
    category: 'custom',
    description: 'Mặt nước phẳng lặng phản chiếu môi trường bầu trời với vân sóng siêu nhẹ.',
    color: '#3182CE',
    tags: ['Nước Động', 'Sóng Biển', 'Lấp Lánh']
  },
  {
    id: 'lumion_waterfall',
    name: 'Waterfall (Thác nước)',
    category: 'custom',
    description: 'Dòng nước chảy dốc thẳng đứng sôi động, sủi bọt trắng tự nhiên liên tục.',
    color: '#63B3ED',
    tags: ['Dòng Chảy', 'Sủi Bọt', 'Emissive']
  },
  {
    id: 'lumion_billboard',
    name: 'Billboard (Hình phẳng)',
    category: 'custom',
    description: 'Vật liệu phát sáng hologram phẳng tự định hướng, chuyên dùng cho biển hiệu.',
    color: '#319795',
    tags: ['Hologram', 'Phát Sáng', 'Biển Hiệu']
  },
  {
    id: 'lumion_invisible',
    name: 'Invisible (Ẩn)',
    category: 'custom',
    description: 'Vật liệu ẩn trong thiết kế, chỉ hiển thị khung lưới kỹ thuật mờ ảo.',
    color: '#4A5568',
    tags: ['Kỹ Thuật', 'Ẩn Nhẹ', 'Mờ Ảo']
  },
  {
    id: 'lumion_landscape',
    name: 'Landscape (Địa hình)',
    category: 'custom',
    description: 'Kết cấu địa hình cỏ pha đất cát tự nhiên bám dính theo bề mặt mô hình.',
    color: '#2F855A',
    tags: ['Địa Hình', 'Tự Nhiên', 'Cỏ Đất']
  },
  {
    id: 'lumion_lightmap',
    name: 'Lightmap',
    category: 'custom',
    description: 'Vật liệu hấp thụ ánh sáng gián tiếp và tự phát sáng dịu nhẹ (Emissive Map).',
    color: '#ECC94B',
    tags: ['Lightmap', 'Tự Phát Sáng', 'Gián Tiếp']
  },
  // NEW Custom
  {
    id: 'lumion_carbon',
    name: 'Carbon Fiber (Sợi Carbon)',
    category: 'custom',
    description: 'Sợi carbon dệt chéo đen bóng thể thao cao cấp, phản xạ sắc nét.',
    color: '#1A202C',
    tags: ['Carbon', 'Thể Thao', 'Cao Cấp']
  },
  {
    id: 'lumion_mirror',
    name: 'Mirror (Gương)',
    category: 'custom',
    description: 'Gương phản chiếu hoàn hảo, kim loại bóng loáng phản xạ 100% môi trường.',
    color: '#CBD5E0',
    tags: ['Gương', 'Phản Xạ', 'Kim Loại']
  },
  {
    id: 'lumion_neon_glow',
    name: 'Neon Glow (Phát sáng Neon)',
    category: 'custom',
    description: 'Vật liệu phát sáng neon rực rỡ với hiệu ứng pulsing động, dùng cho biển hiệu.',
    color: '#FF00FF',
    tags: ['Neon', 'Phát Sáng', 'Pulsing']
  },

  // --- 2. GROUP: INDOOR (Vật liệu Nội thất) ---
  {
    id: 'lumion_fabric',
    name: 'Fabric (Vải Sofa)',
    category: 'indoor',
    description: 'Vải bọc sofa dệt thô mềm mại với texture vải thật từ thư viện Archinteriors.',
    color: '#ED64A6',
    tags: ['Nội Thất', 'Vải Dệt', 'Sofa']
  },
  {
    id: 'lumion_indoor_glass',
    name: 'Glass (Kính nội thất)',
    category: 'indoor',
    description: 'Kính mờ hoặc kính màu trang trí nội thất có độ khúc xạ khúc khuỷu tinh xảo.',
    color: '#90CDF4',
    tags: ['Kính Mờ', 'Màu Nội Thất', 'Khúc Xạ']
  },
  {
    id: 'lumion_leather',
    name: 'Leather (Da)',
    category: 'indoor',
    description: 'Da tự nhiên với vân da chi tiết chân thực, phản xạ dầu tinh tế sang trọng.',
    color: '#B7791F',
    tags: ['Da Thật', 'Vân Sần', 'Thời Trang']
  },
  {
    id: 'lumion_indoor_metal',
    name: 'Metal (Kim loại nội thất)',
    category: 'indoor',
    description: 'Kim loại chrome bạc sáng bóng, phản xạ môi trường sắc nét.',
    color: '#C0C0C0',
    tags: ['Chrome', 'Bạc', 'Sáng Bóng']
  },
  {
    id: 'lumion_plaster',
    name: 'Plaster (Thạch cao)',
    category: 'indoor',
    description: 'Tường thạch cao với kết cấu bề mặt phù điêu, tán xạ ánh sáng đều đặn.',
    color: '#EDF2F7',
    tags: ['Sơn Tường', 'Thạch Cao', 'Phù Điêu']
  },
  {
    id: 'lumion_plastic',
    name: 'Plastic (Nhựa)',
    category: 'indoor',
    description: 'Nhựa ABS tổng hợp chịu lực có độ bền cao với phản xạ Specular sắc nét.',
    color: '#4A5568',
    tags: ['ABS Nhựa', 'Kháng Lực', 'Nhẵn Bóng']
  },
  {
    id: 'lumion_indoor_stone',
    name: 'Stone (Đá Marble)',
    category: 'indoor',
    description: 'Đá Marble cẩm thạch trắng tự nhiên với vân đá chân thực từ texture thật.',
    color: '#E2E8F0',
    tags: ['Marble', 'Cẩm Thạch', 'Mài Bóng']
  },
  {
    id: 'lumion_tiles',
    name: 'Tiles (Gạch Bianco Venato)',
    category: 'indoor',
    description: 'Gạch men Bianco Venato cao cấp với vân marble trắng tinh xảo.',
    color: '#4299E1',
    tags: ['Bianco Venato', 'Gạch Men', 'Cao Cấp']
  },
  {
    id: 'lumion_indoor_wood',
    name: 'Wood (Gỗ sáng)',
    category: 'indoor',
    description: 'Gỗ sồi Clara Beige sáng màu cao cấp phủ vecni bóng, texture vân gỗ thật.',
    color: '#D4A76A',
    tags: ['Gỗ Sồi', 'Vecni Bóng', 'Clara']
  },
  // NEW Indoor
  {
    id: 'lumion_carpet',
    name: 'Carpet (Thảm trải)',
    category: 'indoor',
    description: 'Thảm trải sàn hiện đại với kết cấu sợi dệt mềm mại, màu trung tính.',
    color: '#A0AEC0',
    tags: ['Thảm Dệt', 'Sàn Nhà', 'Êm Ái']
  },
  {
    id: 'lumion_parquet',
    name: 'Parquet (Gỗ ghép)',
    category: 'indoor',
    description: 'Sàn gỗ ghép thanh Coster Copper nâu đồng sang trọng với vân gỗ tự nhiên.',
    color: '#B7791F',
    tags: ['Gỗ Ghép', 'Sàn Nhà', 'Coster']
  },
  {
    id: 'lumion_walnut',
    name: 'Walnut (Gỗ óc chó)',
    category: 'indoor',
    description: 'Gỗ óc chó Clara Wengue tối sẫm cực sang trọng, vân gỗ đậm nét.',
    color: '#5C3A21',
    tags: ['Óc Chó', 'Wengue', 'Sang Trọng']
  },
  {
    id: 'lumion_ceramic',
    name: 'Ceramic (Sứ bóng)',
    category: 'indoor',
    description: 'Gạch sứ Bianco Venato bóng loáng phản chiếu ánh sáng như gương.',
    color: '#F7FAFC',
    tags: ['Sứ Bóng', 'Phản Chiếu', 'Bianco']
  },
  {
    id: 'lumion_chrome',
    name: 'Chrome (Mạ crom)',
    category: 'indoor',
    description: 'Kim loại mạ crom sáng bóng gương hoàn hảo, phản xạ môi trường cực nét.',
    color: '#CBD5E0',
    tags: ['Crom', 'Gương Bóng', 'Inox']
  },

  // --- 3. GROUP: OUTDOOR (Vật liệu Ngoại thất) ---
  {
    id: 'lumion_asphalt',
    name: 'Asphalt (Nhựa đường)',
    category: 'outdoor',
    description: 'Nhựa đường trải thô ráp với texture mặt đường thật từ Archinteriors.',
    color: '#1A202C',
    tags: ['Ngoại Thất', 'Nhựa Đường', 'Thô Ráp']
  },
  {
    id: 'lumion_brick',
    name: 'Brick (Gạch mộc)',
    category: 'outdoor',
    description: 'Gạch nung đỏ tự nhiên với texture gạch thật NAT 60x60 chi tiết cao.',
    color: '#C53030',
    tags: ['Gạch Đỏ', 'Tường Rào', 'Tự Nhiên']
  },
  {
    id: 'lumion_concrete',
    name: 'Concrete (Bê tông)',
    category: 'outdoor',
    description: 'Bê tông đúc thô với texture bề mặt concrete thật từ Archexteriors.',
    color: '#718096',
    tags: ['Bê Tông', 'Thô Ráp', 'Hiện Đại']
  },
  {
    id: 'lumion_outdoor_glass',
    name: 'Glass (Kính ngoại thất)',
    category: 'outdoor',
    description: 'Kính tòa nhà phản quang cực mạnh, tráng gương nhiệt đới khúc xạ mây trời sâu rậm.',
    color: '#63B3ED',
    tags: ['Phản Quang', 'Cường Lực', 'Tòa Nhà']
  },
  {
    id: 'lumion_outdoor_metal',
    name: 'Metal (Kim loại sắt thép)',
    category: 'outdoor',
    description: 'Thép tấm dập công nghiệp với texture steel plate thật, bề mặt sần sùi.',
    color: '#4A5568',
    tags: ['Thép Tấm', 'Công Nghiệp', 'Steel']
  },
  {
    id: 'lumion_outdoor_plaster',
    name: 'Plaster (Vữa ngoại thất)',
    category: 'outdoor',
    description: 'Vữa sần gai mặt ngoài với texture concrete tối từ thư viện Archexteriors.',
    color: '#CBD5E0',
    tags: ['Vữa Ngoài', 'Chống Thấm', 'Sần Gai']
  },
  {
    id: 'lumion_roofing',
    name: 'Roofing (Mái ngói đỏ)',
    category: 'outdoor',
    description: 'Mái ngói Terracotta Spanish Red lượn sóng phản xạ nắng, texture thật.',
    color: '#DD6B20',
    tags: ['Mái Ngói', 'Spanish Red', 'Đất Nung']
  },
  {
    id: 'lumion_outdoor_stone',
    name: 'Stone (Đá ngoại thất)',
    category: 'outdoor',
    description: 'Đá tự nhiên NAT 60x60 gồ ghề với kết cấu bề mặt chi tiết chân thực.',
    color: '#718096',
    tags: ['Đá Phiến', 'Tự Nhiên', 'NAT']
  },
  {
    id: 'lumion_outdoor_wood',
    name: 'Wood (Gỗ ngoại thất)',
    category: 'outdoor',
    description: 'Thanh gỗ ngoài trời thô ráp với vân gỗ tẩm sấy chống cong vênh.',
    color: '#8C6D3F',
    tags: ['Gỗ Tẩm', 'Ngoài Trời', 'Vân Gỗ']
  },
  // NEW Outdoor
  {
    id: 'lumion_cobblestone',
    name: 'Cobblestone (Đá lát đường)',
    category: 'outdoor',
    description: 'Đá lát đường phố cổ điển với texture pave thật, bề mặt gồ ghề tự nhiên.',
    color: '#4A5568',
    tags: ['Đá Lát', 'Cổ Điển', 'Lối Đi']
  },
  {
    id: 'lumion_granite',
    name: 'Granite (Đá hoa cương)',
    category: 'outdoor',
    description: 'Đá granite xám tự nhiên với hạt khoáng chất chấm bi đặc trưng.',
    color: '#718096',
    tags: ['Hoa Cương', 'Granite', 'Bền Bỉ']
  },
  {
    id: 'lumion_corten',
    name: 'Corten Steel (Thép rỉ)',
    category: 'outdoor',
    description: 'Thép Corten rỉ sét nghệ thuật với texture rust thật, patina đỏ nâu.',
    color: '#9B4D2B',
    tags: ['Rỉ Sét', 'Nghệ Thuật', 'Patina']
  },
  {
    id: 'lumion_slate_roof',
    name: 'Slate Roof (Ngói xanh)',
    category: 'outdoor',
    description: 'Mái ngói đá phiến Spanish Blue xám xanh thanh lịch, texture thật.',
    color: '#4A6FA5',
    tags: ['Ngói Xanh', 'Spanish Blue', 'Thanh Lịch']
  },
  {
    id: 'lumion_stucco',
    name: 'Stucco (Vữa trang trí)',
    category: 'outdoor',
    description: 'Vữa trang trí kiểu Địa Trung Hải với kết cấu bề mặt galvanized.',
    color: '#A0AEC0',
    tags: ['Địa Trung Hải', 'Vữa Sần', 'Trang Trí']
  },

  // --- 4. GROUP: NATURE (Vật liệu Tự nhiên) ---
  {
    id: 'lumion_3d_grass',
    name: '3D Grass (Cỏ 3D)',
    category: 'nature',
    description: 'Mặt cỏ 3D với texture cỏ thật từ thư viện, xanh tươi mướt rậm rạp.',
    color: '#48BB78',
    tags: ['Cỏ 3D', 'Mượt Mà', 'Texture Thật']
  },
  {
    id: 'lumion_leaves',
    name: 'Leaves (Lá cây)',
    category: 'nature',
    description: 'Lá cây xanh tươi với texture lá thật, hiệu ứng xuyên sáng mỏng tự nhiên.',
    color: '#38A169',
    tags: ['Lá Leo', 'Foliage', 'Xuyên Sáng']
  },
  {
    id: 'lumion_rock',
    name: 'Rock (Đá tự nhiên)',
    category: 'nature',
    description: 'Khối tảng đá núi trầm tích thô cứng với texture đá concrete tự nhiên.',
    color: '#4A5568',
    tags: ['Đá Núi', 'Trầm Tích', 'Cổ Đại']
  },
  {
    id: 'lumion_soil',
    name: 'Soil (Đất / Cát)',
    category: 'nature',
    description: 'Nền đất đường với texture asphalt road, bề mặt dẻo hạt bám dính chân thực.',
    color: '#744210',
    tags: ['Nền Đất', 'Cát Đồi', 'Thô Mịn']
  },
  {
    id: 'lumion_nature_water',
    name: 'Water (Nước tự nhiên)',
    category: 'nature',
    description: 'Mặt hồ phẳng gợn sóng cá bơi, khúc xạ bóng xanh rêu hoang dã tự cấp.',
    color: '#2B6CB0',
    tags: ['Hồ Rêu', 'Sóng Gợn', 'Tự Nhiên']
  },
  {
    id: 'lumion_fur',
    name: 'Fur (Lông thú)',
    category: 'nature',
    description: 'Lớp sợi lông bồng bềnh siêu mảnh xếp lớp dày mượt tạo bóng mềm chân thực.',
    color: '#718096',
    tags: ['Lông Thú', 'Mịn Màng', 'Xếp Sợi']
  },
  // NEW Nature
  {
    id: 'lumion_moss',
    name: 'Moss (Rêu xanh)',
    category: 'nature',
    description: 'Rêu xanh bám đá ẩm ướt dày đặc với texture lá cây tông xanh đậm.',
    color: '#276749',
    tags: ['Rêu', 'Ẩm Ướt', 'Bám Đá']
  },
  {
    id: 'lumion_gravel',
    name: 'Gravel (Sỏi đá)',
    category: 'nature',
    description: 'Sỏi nhỏ xám tự nhiên với texture bề mặt gồ ghề từ concrete tối.',
    color: '#718096',
    tags: ['Sỏi', 'Đường Mòn', 'Tự Nhiên']
  },
  {
    id: 'lumion_bark',
    name: 'Bark (Vỏ cây)',
    category: 'nature',
    description: 'Vỏ cây thô ráp nứt nẻ với vân gỗ sẫm và bề mặt nhám tự nhiên.',
    color: '#5C3A21',
    tags: ['Vỏ Cây', 'Thô Ráp', 'Nứt Nẻ']
  },
  {
    id: 'lumion_snow',
    name: 'Snow (Tuyết)',
    category: 'nature',
    description: 'Mặt tuyết trắng tinh lấp lánh, bề mặt mịn phản chiếu ánh sáng xanh nhẹ.',
    color: '#F7FAFC',
    tags: ['Tuyết', 'Trắng Tinh', 'Lấp Lánh']
  },
];

export interface UpdatableMaterial {
  material: THREE.Material;
  update: (time: number) => void;
  dispose: () => void;
}

/**
 * Creates dynamic high compatibility Lumion materials inside Three.js
 * Now with REAL texture maps loaded from public/textures/
 */
export function createThreeMaterial(
  id: string,
  envMap: THREE.CubeTexture | null,
  customProps?: any
): UpdatableMaterial {
  const disposables: { dispose: () => void }[] = [];
  let updateFn = (_time: number) => {};

  let material: THREE.Material;

  // Generate reusable procedural bumps & textures
  const scratchMap = Procedural.generateBrushedBrushed();
  const rustMaps = Procedural.generateRustMaps();
  const carbonMap = Procedural.generateCarbonFiber();
  const neutralEnvMap = Procedural.generateNeutralEnvMap();
  disposables.push(scratchMap, rustMaps.color, rustMaps.bump, carbonMap, neutralEnvMap);

  switch (id) {
    // =============================================
    // --- CUSTOM MATERIALS ---
    // =============================================
    case 'custom_shader': {
      const colorVal = customProps?.diffuse || '#ffffff';
      const isTrans = !!customProps?.transparent;
      const opVal = customProps?.opacity !== undefined ? customProps.opacity : 1.0;
      const refVal = customProps?.refraction !== undefined ? customProps.refraction : 1.0;
      
      const glossyVal = customProps?.glossy !== undefined ? customProps.glossy : 0.0;
      const roughnessVal = customProps?.roughness !== undefined ? customProps.roughness : (1.0 - glossyVal);
      const metalnessVal = customProps?.metalness !== undefined ? customProps.metalness : (customProps?.reflection !== undefined ? customProps.reflection : 0.0);
      
      const emissiveVal = customProps?.emissive || '#000000';
      const emissiveIntensityVal = customProps?.emissive_intensity !== undefined ? customProps.emissive_intensity : (customProps?.emissiveIntensity !== undefined ? customProps.emissiveIntensity : 0.0);
      
      const matParams: THREE.MeshPhysicalMaterialParameters = {
        color: new THREE.Color(colorVal),
        metalness: metalnessVal,
        roughness: roughnessVal,
        transparent: isTrans,
        opacity: opVal,
        envMap: envMap,
        envMapIntensity: 1.2,
      };
      
      if (isTrans) {
        matParams.transmission = 1.0 - opVal;
        matParams.thickness = 1.5;
        matParams.ior = refVal;
      }
      
      if (emissiveVal !== '#000000' && emissiveIntensityVal > 0) {
        matParams.emissive = new THREE.Color(emissiveVal);
        matParams.emissiveIntensity = emissiveIntensityVal;
      }
      
      if (customProps?.bump) {
        const nameLower = (customProps.name || '').toLowerCase();
        let bumpTex: THREE.Texture | null = null;
        if (nameLower.includes('inox') || nameLower.includes('xước') || nameLower.includes('brushed')) {
          bumpTex = scratchMap;
        } else if (nameLower.includes('sắt') || nameLower.includes('steel') || nameLower.includes('thép') || nameLower.includes('hộp') || nameLower.includes('fomex') || nameLower.includes('vải') || nameLower.includes('bạt') || nameLower.includes('canvas')) {
          bumpTex = rustMaps.bump;
        }
        if (bumpTex) {
          matParams.bumpMap = bumpTex;
          matParams.bumpScale = 0.05;
        }
      }
      
      material = new THREE.MeshPhysicalMaterial(matParams);
      break;
    }

    case 'lumion_standard': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xcccccc,
        metalness: 0.2,
        roughness: 0.35,
        envMap: envMap,
        envMapIntensity: 1.2,
        clearcoat: 0.1,
        clearcoatRoughness: 0.1,
      });
      break;
    }

    case 'lumion_color': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xe53e3e, // Bold beautiful red paint
        metalness: 0.1,
        roughness: 0.1,
        envMap: envMap,
        envMapIntensity: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });
      break;
    }

    case 'lumion_glass': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.02,
        transmission: 0.95,
        thickness: 1.5,
        ior: 1.52,
        envMap: envMap,
        envMapIntensity: 2.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
      break;
    }

    case 'lumion_water': {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const waterTex = new THREE.CanvasTexture(canvas);
      waterTex.wrapS = THREE.RepeatWrapping;
      waterTex.wrapT = THREE.RepeatWrapping;
      waterTex.repeat.set(2, 2);
      disposables.push(waterTex);

      material = new THREE.MeshPhysicalMaterial({
        color: 0x4299e1,
        roughness: 0.08,
        metalness: 0.1,
        normalMap: waterTex,
        normalScale: new THREE.Vector2(0.25, 0.25),
        transmission: 0.7,
        thickness: 2.0,
        ior: 1.333,
        envMap: envMap,
        envMapIntensity: 1.8,
      });

      updateFn = (time: number) => {
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2.5;
        for (let j = 0; j < 5; j++) {
          const shift = (time * 45 + j * 50) % size;
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, shift, 0, Math.PI * 2);
          ctx.stroke();
        }
        waterTex.needsUpdate = true;
      };
      break;
    }

    case 'lumion_waterfall': {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const wfTex = new THREE.CanvasTexture(canvas);
      wfTex.wrapS = THREE.RepeatWrapping;
      wfTex.wrapT = THREE.RepeatWrapping;
      disposables.push(wfTex);

      material = new THREE.MeshPhysicalMaterial({
        map: wfTex,
        roughness: 0.1,
        metalness: 0.2,
        emissiveMap: wfTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
        envMap: envMap,
        envMapIntensity: 1.5,
      });

      updateFn = (time: number) => {
        ctx.fillStyle = '#2b6cb0';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ffffff';
        for (let idx = 0; idx < 12; idx++) {
          const yPos = (idx * 16 + time * 120) % size;
          ctx.fillRect(0, yPos, size, 4 + Math.sin(time * 5 + idx) * 2);
        }
        wfTex.needsUpdate = true;
      };
      break;
    }

    case 'lumion_billboard': {
      material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x319795) },
          uGlowIntensity: { value: 1.5 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying vec2 vUv;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uGlowIntensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying vec2 vUv;

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
            float fGlow = pow(fresnel, 2.0) * uGlowIntensity;

            float gridScale = 16.0;
            vec2 grid = abs(fract(vUv * gridScale - 0.5) - 0.5) / fwidth(vUv * gridScale);
            float line = min(grid.x, grid.y);
            float gridPattern = 1.0 - min(line, 1.0);

            float scanline = sin(vWorldPosition.y * 15.0 - uTime * 8.0) * 0.5 + 0.5;
            scanline = pow(scanline, 5.0) * 0.5;

            float finalAlpha = fGlow + (gridPattern * 0.5) + scanline;
            vec3 finalColor = uColor * (fGlow * 1.2 + gridPattern * 1.5 + scanline * 2.0 + 0.3);

            gl_FragColor = vec4(finalColor, finalAlpha * 0.7);
          }
        `
      });

      updateFn = (time: number) => {
        (material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      };
      break;
    }

    case 'lumion_invisible': {
      material = new THREE.MeshBasicMaterial({
        color: 0x4a5568,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      break;
    }

    case 'lumion_landscape': {
      const grassTex = loadTexture('nature_grass.jpg', 2, 2);
      disposables.push(grassTex);
      material = new THREE.MeshStandardMaterial({
        map: grassTex,
        color: 0x55885a,
        roughness: 0.85,
        metalness: 0.05,
        bumpMap: loadBumpTexture('nature_grass.jpg', 2, 2),
        bumpScale: 0.02,
      });
      break;
    }

    case 'lumion_lightmap': {
      material = new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        roughness: 0.6,
        emissive: 0xecc94b,
        emissiveIntensity: 1.2,
      });
      break;
    }

    // NEW Custom Materials
    case 'lumion_carbon': {
      material = new THREE.MeshPhysicalMaterial({
        map: carbonMap,
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMap: envMap,
        envMapIntensity: 1.8,
      });
      break;
    }

    case 'lumion_mirror': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.0,
        envMap: neutralEnvMap,
        envMapIntensity: 3.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
      break;
    }

    case 'lumion_neon_glow': {
      material = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 2.5,
        roughness: 0.2,
        metalness: 0.1,
      });

      updateFn = (time: number) => {
        const pulse = Math.sin(time * 3.0) * 0.5 + 0.5;
        const hue = (time * 0.1) % 1.0;
        const mat = material as THREE.MeshStandardMaterial;
        mat.emissive.setHSL(hue, 1.0, 0.5);
        mat.color.setHSL(hue, 1.0, 0.5);
        mat.emissiveIntensity = 1.5 + pulse * 2.0;
      };
      break;
    }

    // =============================================
    // --- INDOOR MATERIALS (with real textures) ---
    // =============================================
    case 'lumion_fabric': {
      const fabricTex = loadTexture('fabric_sofa.jpg', 2, 2);
      disposables.push(fabricTex);
      material = new THREE.MeshPhysicalMaterial({
        map: fabricTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('fabric_sofa.jpg', 2, 2),
        bumpScale: 0.008,
        sheenColor: new THREE.Color(0xffffff),
        sheen: 0.8,
        sheenRoughness: 0.5,
      });
      break;
    }

    case 'lumion_indoor_glass': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0x90cdfa,
        roughness: 0.3,
        transmission: 0.85,
        thickness: 0.8,
        ior: 1.45,
        envMap: envMap,
        envMapIntensity: 1.2,
      });
      break;
    }

    case 'lumion_leather': {
      const leatherTex = loadTexture('leather_diffuse.jpg', 2, 2);
      disposables.push(leatherTex);
      material = new THREE.MeshPhysicalMaterial({
        map: leatherTex,
        roughness: 0.65,
        metalness: 0.05,
        bumpMap: loadBumpTexture('leather_diffuse.jpg', 2, 2),
        bumpScale: 0.015,
        clearcoat: 0.15,
        clearcoatRoughness: 0.4,
      });
      break;
    }

    case 'lumion_indoor_metal': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0x666666,
        metalness: 1.0,
        roughness: 0.12,
        bumpMap: scratchMap,
        bumpScale: 0.002,
        envMap: neutralEnvMap,
        envMapIntensity: 2.5,
        clearcoat: 0.6,
        clearcoatRoughness: 0.03,
      });
      break;
    }

    case 'lumion_plaster': {
      const plasterTex = loadTexture('plaster_detail.jpg', 3, 3);
      disposables.push(plasterTex);
      material = new THREE.MeshStandardMaterial({
        map: plasterTex,
        color: 0xedf2f7,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('plaster_detail.jpg', 3, 3),
        bumpScale: 0.006,
      });
      break;
    }

    case 'lumion_plastic': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0x2d3748,
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 0.4,
        clearcoatRoughness: 0.1,
        envMap: envMap,
      });
      break;
    }

    case 'lumion_indoor_stone': {
      const marbleTex = loadTexture('marble_grey.jpg', 1, 1);
      disposables.push(marbleTex);
      material = new THREE.MeshPhysicalMaterial({
        map: marbleTex,
        roughness: 0.08,
        metalness: 0.0,
        envMap: envMap,
        envMapIntensity: 1.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.02,
      });
      break;
    }

    case 'lumion_tiles': {
      const tileTex = loadTexture('tile_bianco.jpg', 2, 2);
      disposables.push(tileTex);
      material = new THREE.MeshPhysicalMaterial({
        map: tileTex,
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        envMap: envMap,
        envMapIntensity: 1.0,
      });
      break;
    }

    case 'lumion_indoor_wood': {
      const woodTex = loadTexture('wood_clara_beige.jpg', 3, 3);
      disposables.push(woodTex);
      material = new THREE.MeshPhysicalMaterial({
        map: woodTex,
        roughness: 0.25,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_clara_beige.jpg', 3, 3),
        bumpScale: 0.005,
        clearcoat: 0.8,
        clearcoatRoughness: 0.08,
        envMap: envMap,
        envMapIntensity: 0.6,
      });
      break;
    }

    // NEW Indoor Materials
    case 'lumion_carpet': {
      const carpetTex = loadTexture('fabric_carpet.jpg', 2, 2);
      disposables.push(carpetTex);
      material = new THREE.MeshStandardMaterial({
        map: carpetTex,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('fabric_carpet.jpg', 2, 2),
        bumpScale: 0.01,
      });
      break;
    }

    case 'lumion_parquet': {
      const parquetTex = loadTexture('wood_parquet.jpg', 4, 4);
      disposables.push(parquetTex);
      material = new THREE.MeshPhysicalMaterial({
        map: parquetTex,
        roughness: 0.3,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_parquet.jpg', 4, 4),
        bumpScale: 0.004,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        envMap: envMap,
        envMapIntensity: 0.4,
      });
      break;
    }

    case 'lumion_walnut': {
      const walnutTex = loadTexture('wood_walnut_dark.jpg', 3, 3);
      disposables.push(walnutTex);
      material = new THREE.MeshPhysicalMaterial({
        map: walnutTex,
        roughness: 0.2,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_walnut_dark.jpg', 3, 3),
        bumpScale: 0.005,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap: envMap,
        envMapIntensity: 0.5,
      });
      break;
    }

    case 'lumion_ceramic': {
      const ceramicTex = loadTexture('tile_venato.jpg', 1, 1);
      disposables.push(ceramicTex);
      material = new THREE.MeshPhysicalMaterial({
        map: ceramicTex,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMap: envMap,
        envMapIntensity: 1.6,
      });
      break;
    }

    case 'lumion_chrome': {
      const steelTex = loadTexture('metal_steel.jpg', 2, 2);
      disposables.push(steelTex);
      material = new THREE.MeshPhysicalMaterial({
        map: steelTex,
        color: 0xdddddd,
        metalness: 1.0,
        roughness: 0.02,
        envMap: neutralEnvMap,
        envMapIntensity: 2.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
      break;
    }

    // =============================================
    // --- OUTDOOR MATERIALS (with real textures) ---
    // =============================================
    case 'lumion_asphalt': {
      const asphaltTex = loadTexture('asphalt_pave.jpg', 2, 2);
      disposables.push(asphaltTex);
      material = new THREE.MeshStandardMaterial({
        map: asphaltTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('asphalt_pave.jpg', 2, 2),
        bumpScale: 0.03,
      });
      break;
    }

    case 'lumion_brick': {
      const brickTex = loadTexture('brick_red.jpg', 2, 2);
      disposables.push(brickTex);
      material = new THREE.MeshStandardMaterial({
        map: brickTex,
        roughness: 0.85,
        metalness: 0.0,
        bumpMap: loadBumpTexture('brick_red.jpg', 2, 2),
        bumpScale: 0.02,
      });
      break;
    }

    case 'lumion_concrete': {
      const concreteTex = loadTexture('concrete_rough.jpg', 2, 2);
      disposables.push(concreteTex);
      material = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.8,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_rough.jpg', 2, 2),
        bumpScale: 0.025,
      });
      break;
    }

    case 'lumion_outdoor_glass': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xbbeef7,
        metalness: 0.8,
        roughness: 0.05,
        transmission: 0.6,
        ior: 1.6,
        envMap: envMap,
        envMapIntensity: 2.2,
        clearcoat: 1.0,
      });
      break;
    }

    case 'lumion_outdoor_metal': {
      const metalTex = loadTexture('metal_steel.jpg', 2, 2);
      disposables.push(metalTex);
      material = new THREE.MeshPhysicalMaterial({
        map: metalTex,
        color: 0x888888,
        metalness: 0.9,
        roughness: 0.45,
        bumpMap: loadBumpTexture('metal_steel.jpg', 2, 2),
        bumpScale: 0.015,
        envMap: envMap,
        envMapIntensity: 1.2,
      });
      break;
    }

    case 'lumion_outdoor_plaster': {
      const plasterOutTex = loadTexture('concrete_dark.jpg', 2, 2);
      disposables.push(plasterOutTex);
      material = new THREE.MeshStandardMaterial({
        map: plasterOutTex,
        color: 0xcbd5e0,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_dark.jpg', 2, 2),
        bumpScale: 0.04,
      });
      break;
    }

    case 'lumion_roofing': {
      const roofTex = loadTexture('roof_red.jpg', 3, 3);
      disposables.push(roofTex);
      material = new THREE.MeshStandardMaterial({
        map: roofTex,
        roughness: 0.75,
        metalness: 0.0,
        bumpMap: loadBumpTexture('roof_red.jpg', 3, 3),
        bumpScale: 0.015,
      });
      break;
    }

    case 'lumion_outdoor_stone': {
      const stoneTex = loadTexture('brick_natural.jpg', 2, 2);
      disposables.push(stoneTex);
      material = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('brick_natural.jpg', 2, 2),
        bumpScale: 0.035,
      });
      break;
    }

    case 'lumion_outdoor_wood': {
      const woodOutTex = loadTexture('wood_plank.jpg', 3, 3);
      disposables.push(woodOutTex);
      material = new THREE.MeshStandardMaterial({
        map: woodOutTex,
        roughness: 0.75,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_plank.jpg', 3, 3),
        bumpScale: 0.02,
      });
      break;
    }

    // NEW Outdoor Materials
    case 'lumion_cobblestone': {
      const cobbleTex = loadTexture('asphalt_pave.jpg', 3, 3);
      disposables.push(cobbleTex);
      material = new THREE.MeshStandardMaterial({
        map: cobbleTex,
        roughness: 0.88,
        metalness: 0.0,
        bumpMap: loadBumpTexture('asphalt_pave.jpg', 3, 3),
        bumpScale: 0.045,
      });
      break;
    }

    case 'lumion_granite': {
      const graniteTex = loadTexture('marble_grey.jpg', 2, 2);
      disposables.push(graniteTex);
      material = new THREE.MeshPhysicalMaterial({
        map: graniteTex,
        roughness: 0.4,
        metalness: 0.05,
        bumpMap: loadBumpTexture('marble_grey.jpg', 2, 2),
        bumpScale: 0.01,
        envMap: envMap,
        envMapIntensity: 0.6,
      });
      break;
    }

    case 'lumion_corten': {
      const cortenTex = loadTexture('metal_rust.jpg', 3, 3);
      disposables.push(cortenTex);
      material = new THREE.MeshStandardMaterial({
        map: cortenTex,
        color: 0xbb6633,
        roughness: 0.85,
        metalness: 0.4,
        bumpMap: loadBumpTexture('metal_rust.jpg', 3, 3),
        bumpScale: 0.03,
      });
      break;
    }

    case 'lumion_slate_roof': {
      const slateTex = loadTexture('roof_blue.jpg', 3, 3);
      disposables.push(slateTex);
      material = new THREE.MeshStandardMaterial({
        map: slateTex,
        roughness: 0.7,
        metalness: 0.0,
        bumpMap: loadBumpTexture('roof_blue.jpg', 3, 3),
        bumpScale: 0.015,
      });
      break;
    }

    case 'lumion_stucco': {
      const stuccoTex = loadTexture('metal_galvanized.jpg', 3, 3);
      disposables.push(stuccoTex);
      material = new THREE.MeshStandardMaterial({
        map: stuccoTex,
        color: 0xe8dfd0,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: loadBumpTexture('metal_galvanized.jpg', 3, 3),
        bumpScale: 0.02,
      });
      break;
    }

    // =============================================
    // --- NATURE MATERIALS (with real textures) ---
    // =============================================
    case 'lumion_3d_grass': {
      const grassTex = loadTexture('nature_grass.jpg', 3, 3);
      disposables.push(grassTex);
      material = new THREE.MeshStandardMaterial({
        map: grassTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('nature_grass.jpg', 3, 3),
        bumpScale: 0.03,
      });
      break;
    }

    case 'lumion_leaves': {
      const leavesTex = loadTexture('nature_leaves.jpg', 2, 2);
      disposables.push(leavesTex);
      material = new THREE.MeshPhysicalMaterial({
        map: leavesTex,
        roughness: 0.6,
        metalness: 0.0,
        transmission: 0.2,
        thickness: 0.5,
        envMap: envMap,
        envMapIntensity: 0.5,
      });
      break;
    }

    case 'lumion_rock': {
      const rockTex = loadTexture('concrete_dark.jpg', 2, 2);
      disposables.push(rockTex);
      material = new THREE.MeshStandardMaterial({
        map: rockTex,
        color: 0x666666,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_dark.jpg', 2, 2),
        bumpScale: 0.06,
      });
      break;
    }

    case 'lumion_soil': {
      const soilTex = loadTexture('asphalt_road.jpg', 2, 2);
      disposables.push(soilTex);
      material = new THREE.MeshStandardMaterial({
        map: soilTex,
        color: 0x8b7355,
        roughness: 0.98,
        metalness: 0.0,
        bumpMap: loadBumpTexture('asphalt_road.jpg', 2, 2),
        bumpScale: 0.045,
      });
      break;
    }

    case 'lumion_nature_water': {
      const size1 = 128;
      const canvas1 = document.createElement('canvas');
      canvas1.width = size1;
      canvas1.height = size1;
      const ctx1 = canvas1.getContext('2d')!;

      const lakeTex = new THREE.CanvasTexture(canvas1);
      lakeTex.wrapS = THREE.RepeatWrapping;
      lakeTex.wrapT = THREE.RepeatWrapping;
      disposables.push(lakeTex);

      material = new THREE.MeshPhysicalMaterial({
        color: 0x2c5282,
        roughness: 0.05,
        transmission: 0.8,
        thickness: 4.0,
        normalMap: lakeTex,
        normalScale: new THREE.Vector2(0.3, 0.3),
        envMap: envMap,
        envMapIntensity: 2.0,
      });

      updateFn = (time: number) => {
        ctx1.fillStyle = '#8080ff';
        ctx1.fillRect(0, 0, size1, size1);
        ctx1.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx1.lineWidth = 3;

        for (let j = 0; j < 3; j++) {
          const shift = (time * 20 + j * 40) % size1;
          ctx1.beginPath();
          ctx1.moveTo(0, shift);
          ctx1.bezierCurveTo(size1 / 3, shift + 10 * Math.sin(time), size1 * 0.66, shift - 10 * Math.sin(time), size1, shift);
          ctx1.stroke();
        }
        lakeTex.needsUpdate = true;
      };
      break;
    }

    case 'lumion_fur': {
      const fabricFurTex = loadTexture('fabric_modern_carpet.jpg', 3, 3);
      disposables.push(fabricFurTex);
      material = new THREE.MeshPhysicalMaterial({
        map: fabricFurTex,
        roughness: 0.98,
        metalness: 0.0,
        bumpMap: loadBumpTexture('fabric_modern_carpet.jpg', 3, 3),
        bumpScale: 0.04,
        sheenColor: new THREE.Color(0xffffff),
        sheen: 1.0,
        sheenRoughness: 0.9,
      });
      break;
    }

    // NEW Nature Materials
    case 'lumion_moss': {
      const mossTex = loadTexture('nature_leaves.jpg', 4, 4);
      disposables.push(mossTex);
      material = new THREE.MeshStandardMaterial({
        map: mossTex,
        color: 0x2d6633,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('nature_leaves.jpg', 4, 4),
        bumpScale: 0.035,
      });
      break;
    }

    case 'lumion_gravel': {
      const gravelTex = loadTexture('concrete_dark.jpg', 4, 4);
      disposables.push(gravelTex);
      material = new THREE.MeshStandardMaterial({
        map: gravelTex,
        color: 0x999999,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_dark.jpg', 4, 4),
        bumpScale: 0.05,
      });
      break;
    }

    case 'lumion_bark': {
      const barkTex = loadTexture('wood_plank.jpg', 2, 2);
      disposables.push(barkTex);
      material = new THREE.MeshStandardMaterial({
        map: barkTex,
        color: 0x5c3a21,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_plank.jpg', 2, 2),
        bumpScale: 0.06,
      });
      break;
    }

    case 'lumion_snow': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xf0f5ff,
        roughness: 0.3,
        metalness: 0.0,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        bumpMap: scratchMap,
        bumpScale: 0.002,
        envMap: envMap,
        envMapIntensity: 0.8,
        sheenColor: new THREE.Color(0xaaccff),
        sheen: 0.5,
        sheenRoughness: 0.3,
      });
      break;
    }

    default: {
      material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.5,
        metalness: 0.2
      });
      break;
    }
  }

  return {
    material,
    update: updateFn,
    dispose: () => {
      material.dispose();
      disposables.forEach((item) => item.dispose());
    }
  };
}
