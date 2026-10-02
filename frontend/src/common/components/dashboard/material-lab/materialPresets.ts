/**
 * Lumion Material Library — Preset Definitions
 * Static data: no Three.js dependency.
 */

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
