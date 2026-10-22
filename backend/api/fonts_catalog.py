# -*- coding: utf-8 -*-
"""
fonts_catalog.py - Danh mục 100 Font chữ chuyên dụng cho Ngành Bảng hiệu & Quảng cáo
Hỗ trợ tiếng Việt đầy đủ, tối ưu cho chữ nổi Mica, Inox, Alu, Hộp đèn, CNC Laser.
"""

import os
import json

CORE_SIGNAGE_FONTS = [
    # 1. Sans-serif Hiện đại & Tối giản (30 fonts)
    {"id": "be-vietnam-pro", "name": "Be Vietnam Pro", "category": "sans-serif", "category_vn": "Chuẩn Việt hiện đại", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Chữ mica, biển công ty"},
    {"id": "roboto", "name": "Roboto", "category": "sans-serif", "category_vn": "Không chân hiện đại", "weights": [400, 500, 700, 900], "styles": ["normal", "italic"], "best_for": "Mặt biển, pano, chữ hộp"},
    {"id": "montserrat", "name": "Montserrat", "category": "sans-serif", "category_vn": "Không chân hiện đại", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Logo, chữ nổi showroom"},
    {"id": "oswald", "name": "Oswald", "category": "sans-serif", "category_vn": "Biển đứng cao gọn", "weights": [400, 500, 600, 700], "styles": ["normal"], "best_for": "Biển vẫy, chữ hộp đứng"},
    {"id": "open-sans", "name": "Open Sans", "category": "sans-serif", "category_vn": "Không chân hiện đại", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Biển chỉ dẫn, văn phòng"},
    {"id": "lato", "name": "Lato", "category": "sans-serif", "category_vn": "Không chân hiện đại", "weights": [400, 700, 900], "styles": ["normal", "italic"], "best_for": "Biển hộp đèn, chữ mica"},
    {"id": "poppins", "name": "Poppins", "category": "sans-serif", "category_vn": "Hình học tròn mềm", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Trẻ trung, trà sữa, thời trang"},
    {"id": "inter", "name": "Inter", "category": "sans-serif", "category_vn": "Sắc nét công nghệ", "weights": [400, 600, 700, 800], "styles": ["normal"], "best_for": "Biển toà nhà, công nghệ"},
    {"id": "raleway", "name": "Raleway", "category": "sans-serif", "category_vn": "Thanh lịch tinh tế", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Thẩm mỹ, nội thất cao cấp"},
    {"id": "nunito", "name": "Nunito", "category": "sans-serif", "category_vn": "Bo tròn góc mềm", "weights": [400, 600, 700, 800], "styles": ["normal"], "best_for": "Mầm non, đồ chơi, gia đình"},
    {"id": "barlow", "name": "Barlow", "category": "sans-serif", "category_vn": "Biển hiệu công nghiệp", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Giao thông, biển chỉ dẫn"},
    {"id": "kanit", "name": "Kanit", "category": "sans-serif", "category_vn": "Khỏe khoắn dứt khoát", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Biển gara, thể thao"},
    {"id": "ubuntu", "name": "Ubuntu", "category": "sans-serif", "category_vn": "Hiện đại đường nét cong", "weights": [400, 500, 700], "styles": ["normal", "italic"], "best_for": "Điện thoại, điện máy"},
    {"id": "archivo", "name": "Archivo", "category": "sans-serif", "category_vn": "Đậm chắc dày mép", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Pano ngoài trời, chữ hắt sáng"},
    {"id": "cabin", "name": "Cabin", "category": "sans-serif", "category_vn": "Nhân văn hiện đại", "weights": [400, 600, 700], "styles": ["normal", "italic"], "best_for": "Biển phòng ban, phòng khám"},
    {"id": "fira-sans", "name": "Fira Sans", "category": "sans-serif", "category_vn": "Hình học cân đối", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Công nghệ, điện máy"},
    {"id": "work-sans", "name": "Work Sans", "category": "sans-serif", "category_vn": "Đơn giản thực tế", "weights": [400, 600, 700, 800], "styles": ["normal"], "best_for": "Xưởng sản xuất, kho bãi"},
    {"id": "quicksand", "name": "Quicksand", "category": "sans-serif", "category_vn": "Bo tròn thanh thoát", "weights": [400, 600, 700], "styles": ["normal"], "best_for": "Spa, mỹ phẩm, thời trang nữ"},
    {"id": "plus-jakarta-sans", "name": "Plus Jakarta Sans", "category": "sans-serif", "category_vn": "Hiện đại phong cách mới", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Startup, văn phòng hiện đại"},
    {"id": "heebo", "name": "Heebo", "category": "sans-serif", "category_vn": "Dứt khoát rõ ràng", "weights": [400, 600, 700, 900], "styles": ["normal"], "best_for": "Biển phụ, thông tin kỹ thuật"},
    {"id": "prompt", "name": "Prompt", "category": "sans-serif", "category_vn": "Hình khối cứng cáp", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Cơ khí, điện tử, bảo dưỡng"},
    {"id": "mulish", "name": "Mulish", "category": "sans-serif", "category_vn": "Mịn màng tối giản", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Kiến trúc, nội thất"},
    {"id": "rubik", "name": "Rubik", "category": "sans-serif", "category_vn": "Bo tròn cạnh nhẹ", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Quán ăn nhanh, đồ uống"},
    {"id": "titillium-web", "name": "Titillium Web", "category": "sans-serif", "category_vn": "Cơ khí công nghệ cao", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Biển xưởng, showroom xe"},
    {"id": "dm-sans", "name": "DM Sans", "category": "sans-serif", "category_vn": "Chính xác hình học", "weights": [400, 500, 700], "styles": ["normal", "italic"], "best_for": "Phòng trưng bày, viện thẩm mỹ"},
    {"id": "outfit", "name": "Outfit", "category": "sans-serif", "category_vn": "Năng động hiện đại", "weights": [400, 600, 700, 900], "styles": ["normal"], "best_for": "Thời trang streetwear, gym"},
    {"id": "barlow-condensed", "name": "Barlow Condensed", "category": "sans-serif", "category_vn": "Co hẹp bề ngang", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Nhiều chữ, mặt biển hẹp"},
    {"id": "teko", "name": "Teko", "category": "sans-serif", "category_vn": "Dạng hộp cao vút", "weights": [400, 500, 600, 700], "styles": ["normal"], "best_for": "Chữ hộp cao, biển số nhà"},
    {"id": "fjalla-one", "name": "Fjalla One", "category": "sans-serif", "category_vn": "Chữ hoa đậm nét", "weights": [400], "styles": ["normal"], "best_for": "Tiêu đề lớn, biển bạt pano"},
    {"id": "yanone-kaffeesatz", "name": "Yanone Kaffeesatz", "category": "sans-serif", "category_vn": "Cổ điển mảnh cao", "weights": [400, 600, 700], "styles": ["normal"], "best_for": "Quán cafe, tiệm bánh vintage"},

    # 2. Display & Chữ Nổi Quảng Cáo (25 fonts)
    {"id": "anton", "name": "Anton", "category": "display", "category_vn": "Chữ nổi biển hiệu số 1", "weights": [400], "styles": ["normal"], "best_for": "Chữ nổi mica, alu, inox dày"},
    {"id": "bangers", "name": "Bangers", "category": "display", "category_vn": "Nổi bật phong cách comic", "weights": [400], "styles": ["normal"], "best_for": "Trà chanh, đồ ăn vặt, vui nhộn"},
    {"id": "bungee", "name": "Bungee", "category": "display", "category_vn": "Khối hộp viền thẳng", "weights": [400], "styles": ["normal"], "best_for": "Chữ nổi chân viền nhôm"},
    {"id": "righteous", "name": "Righteous", "category": "display", "category_vn": "Retro Neon uốn lượn", "weights": [400], "styles": ["normal"], "best_for": "Đèn Neon Sign, Bar, Pub"},
    {"id": "shrikhand", "name": "Shrikhand", "category": "display", "category_vn": "Dày nét uốn nghệ thuật", "weights": [400], "styles": ["normal"], "best_for": "Tiệm may, cafe phong cách cũ"},
    {"id": "alfa-slab-one", "name": "Alfa Slab One", "category": "display", "category_vn": "Siêu dày chân vuông", "weights": [400], "styles": ["normal"], "best_for": "Khối dày, biển toà nhà ngoài trời"},
    {"id": "bebas-neue", "name": "Bebas Neue", "category": "display", "category_vn": "Kinh điển ngành quảng cáo", "weights": [400], "styles": ["normal"], "best_for": "Tất cả các loại mặt biển Pano"},
    {"id": "passion-one", "name": "Passion One", "category": "display", "category_vn": "Dày chắc bo mép", "weights": [400, 700, 900], "styles": ["normal"], "best_for": "Biển hộp đèn mica hút nổi"},
    {"id": "rowdies", "name": "Rowdies", "category": "display", "category_vn": "Khỏe khoắn ấn tượng", "weights": [400, 700], "styles": ["normal"], "best_for": "Phòng Gym, thể hình, boxing"},
    {"id": "russo-one", "name": "Russo One", "category": "display", "category_vn": "Góc cạnh quân đội", "weights": [400], "styles": ["normal"], "best_for": "Cơ khí, lốp xe, phụ tùng ô tô"},
    {"id": "faster-one", "name": "Faster One", "category": "display", "category_vn": "Tốc độ sọc ngang", "weights": [400], "styles": ["normal"], "best_for": "Chuyển phát nhanh, xe độ"},
    {"id": "black-ops-one", "name": "Black Ops One", "category": "display", "category_vn": "Khoét rãnh Stencil", "weights": [400], "styles": ["normal"], "best_for": "Cắt CNC laser, tôn đột lỗ"},
    {"id": "audiowide", "name": "Audiowide", "category": "display", "category_vn": "Tương lai Sci-Fi", "weights": [400], "styles": ["normal"], "best_for": "Game net, quán cyber, công nghệ"},
    {"id": "orbitron", "name": "Orbitron", "category": "display", "category_vn": "Hình học tương lai", "weights": [400, 600, 700, 900], "styles": ["normal"], "best_for": "Viễn thông, máy tính, LED"},
    {"id": "squada-one", "name": "Squada One", "category": "display", "category_vn": "Vuông khối thể thao", "weights": [400], "styles": ["normal"], "best_for": "Sân bóng, phụ kiện xe máy"},
    {"id": "titan-one", "name": "Titan One", "category": "display", "category_vn": "Mũm mĩm bo tròn to", "weights": [400], "styles": ["normal"], "best_for": "Quán kem, bánh ngọt, trẻ em"},
    {"id": "paytone-one", "name": "Paytone One", "category": "display", "category_vn": "Đậm đà dễ nhìn xa", "weights": [400], "styles": ["normal"], "best_for": "Pano quốc lộ, biển cây xăng"},
    {"id": "carter-one", "name": "Carter One", "category": "display", "category_vn": "Mềm mại thân thiện", "weights": [400], "styles": ["normal"], "best_for": "Nhà hàng gia đình, phở, bún"},
    {"id": "fugaz-one", "name": "Fugaz One", "category": "display", "category_vn": "Nghiêng tốc độ sống động", "weights": [400], "styles": ["normal"], "best_for": "Đồ chơi xe, quán nướng"},
    {"id": "luckiest-guy", "name": "Luckiest Guy", "category": "display", "category_vn": "Hoạt hình vui nhộn", "weights": [400], "styles": ["normal"], "best_for": "Khu vui chơi, nhà trẻ"},
    {"id": "bowlby-one", "name": "Bowlby One", "category": "display", "category_vn": "Khối đúc nặng", "weights": [400], "styles": ["normal"], "best_for": "Cơ khí đúc, xưởng mộc"},
    {"id": "sigmar", "name": "Sigmar", "category": "display", "category_vn": "Hài hước vui nhộn", "weights": [400], "styles": ["normal"], "best_for": "Quán ốc, bia hơi, quán nhậu"},
    {"id": "chango", "name": "Chango", "category": "display", "category_vn": "Góc cạnh lạ mắt", "weights": [400], "styles": ["normal"], "best_for": "Lễ hội, đồ chơi, quán độc lạ"},
    {"id": "fredoka-one", "name": "Fredoka One", "category": "display", "category_vn": "Tròn trịa đáng yêu", "weights": [400], "styles": ["normal"], "best_for": "Trà sữa, bánh mì kẹp"},
    {"id": "bungee-shade", "name": "Bungee Shade", "category": "display", "category_vn": "Có bóng đổ 3D sẵn", "weights": [400], "styles": ["normal"], "best_for": "Biển vẽ tay, biển phong cách phố"},

    # 3. Serif Sang Trọng & Cổ Điển (20 fonts)
    {"id": "playfair-display", "name": "Playfair Display", "category": "serif", "category_vn": "Sang trọng quý tộc", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Vàng bạc, trang sức, spa vip"},
    {"id": "merriweather", "name": "Merriweather", "category": "serif", "category_vn": "Có chân chuẩn mực", "weights": [400, 700, 900], "styles": ["normal", "italic"], "best_for": "Văn phòng luật sư, công chứng"},
    {"id": "lora", "name": "Lora", "category": "serif", "category_vn": "Nghệ thuật đương đại", "weights": [400, 600, 700], "styles": ["normal", "italic"], "best_for": "Phòng tranh, trà đạo, sách"},
    {"id": "cinzel", "name": "Cinzel", "category": "serif", "category_vn": "Chạm khắc La Mã", "weights": [400, 600, 700, 900], "styles": ["normal"], "best_for": "Khách sạn 5 sao, thẩm mỹ viện"},
    {"id": "cormorant-garamond", "name": "Cormorant Garamond", "category": "serif", "category_vn": "Cổ điển thanh tao", "weights": [400, 600, 700], "styles": ["normal", "italic"], "best_for": "Áo cưới, thời trang dạ hội"},
    {"id": "bodoni-moda", "name": "Bodoni Moda", "category": "serif", "category_vn": "Thời trang cao cấp Haute", "weights": [400, 600, 700, 900], "styles": ["normal", "italic"], "best_for": "Thương hiệu thời trang, mỹ phẩm"},
    {"id": "prata", "name": "Prata", "category": "serif", "category_vn": "Giọt nước thanh lịch", "weights": [400], "styles": ["normal"], "best_for": "Nail, mi, chăm sóc sắc đẹp"},
    {"id": "eb-garamond", "name": "EB Garamond", "category": "serif", "category_vn": "Lịch sử châu Âu", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Nhà hàng Âu, hầm rượu"},
    {"id": "spectral", "name": "Spectral", "category": "serif", "category_vn": "Sắc sảo trang trọng", "weights": [400, 600, 700], "styles": ["normal", "italic"], "best_for": "Bệnh viện tư, dược phẩm"},
    {"id": "alegreya", "name": "Alegreya", "category": "serif", "category_vn": "Nhịp nhàng văn học", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Trường học, thư viện, hội họa"},
    {"id": "libre-baskerville", "name": "Libre Baskerville", "category": "serif", "category_vn": "Vững chãi quyền uy", "weights": [400, 700], "styles": ["normal", "italic"], "best_for": "Tài chính, ngân hàng, bảo hiểm"},
    {"id": "marcellus", "name": "Marcellus", "category": "serif", "category_vn": "Khắc đá tinh giản", "weights": [400], "styles": ["normal"], "best_for": "Gốm sứ, đá phong thủy"},
    {"id": "castoro", "name": "Castoro", "category": "serif", "category_vn": "Trang nhã học thuật", "weights": [400], "styles": ["normal", "italic"], "best_for": "Trung tâm ngoại ngữ, du học"},
    {"id": "cardo", "name": "Cardo", "category": "serif", "category_vn": "Học giả cổ điển", "weights": [400, 700], "styles": ["normal", "italic"], "best_for": "Đồ cổ, nhà cổ truyền thống"},
    {"id": "faustina", "name": "Faustina", "category": "serif", "category_vn": "Chân phương sắc bén", "weights": [400, 600, 700, 800], "styles": ["normal", "italic"], "best_for": "Nhà in, tòa soạn"},
    {"id": "volkhov", "name": "Volkhov", "category": "serif", "category_vn": "Chân vuông cứng cáp", "weights": [400, 700], "styles": ["normal", "italic"], "best_for": "Cơ quan hành chính, đoàn thể"},
    {"id": "dm-serif-display", "name": "DM Serif Display", "category": "serif", "category_vn": "Bản in tương phản mạnh", "weights": [400], "styles": ["normal", "italic"], "best_for": "Tạp chí, studio ảnh cưới"},
    {"id": "yeseva-one", "name": "Yeseva One", "category": "serif", "category_vn": "Đường cong quyến rũ", "weights": [400], "styles": ["normal"], "best_for": "Spa thảo mộc, xông hơi"},
    {"id": "rozha-one", "name": "Rozha One", "category": "serif", "category_vn": "Nét dày mỏng ấn tượng", "weights": [400], "styles": ["normal"], "best_for": "Tiệm vàng, đá quý phong thủy"},
    {"id": "abril-fatface", "name": "Abril Fatface", "category": "serif", "category_vn": "Chân béo quý phái", "weights": [400], "styles": ["normal"], "best_for": "Boutique, salon tóc cao cấp"},

    # 4. Script & Nghệ Thuật Uốn Lượn (15 fonts)
    {"id": "lobster", "name": "Lobster", "category": "script", "category_vn": "Uốn lượn số 1 quảng cáo", "weights": [400], "styles": ["normal"], "best_for": "Hải sản, lẩu nướng, quán ăn"},
    {"id": "dancing-script", "name": "Dancing Script", "category": "script", "category_vn": "Nhảy múa mềm mại", "weights": [400, 600, 700], "styles": ["normal"], "best_for": "Tiệm hoa tươi, quà tặng"},
    {"id": "pacifico", "name": "Pacifico", "category": "script", "category_vn": "Phong cách bãi biển lướt sóng", "weights": [400], "styles": ["normal"], "best_for": "Quán sinh tố, kem, đồ uống hè"},
    {"id": "great-vibes", "name": "Great Vibes", "category": "script", "category_vn": "Thư pháp hoàng gia", "weights": [400], "styles": ["normal"], "best_for": "Thiệp cưới, studio chụp hình"},
    {"id": "satisfy", "name": "Satisfy", "category": "script", "category_vn": "Bút lông mềm mại", "weights": [400], "styles": ["normal"], "best_for": "Tiệm bánh ngọt, cafe acoustic"},
    {"id": "alex-brush", "name": "Alex Brush", "category": "script", "category_vn": "Nét cọ thanh thoát", "weights": [400], "styles": ["normal"], "best_for": "Mỹ phẩm thiên nhiên, yoga"},
    {"id": "caveat", "name": "Caveat", "category": "script", "category_vn": "Chữ viết tay tự nhiên", "weights": [400, 600, 700], "styles": ["normal"], "best_for": "Quán pub nhỏ, ghi chú menu"},
    {"id": "sacramento", "name": "Sacramento", "category": "script", "category_vn": "Mảnh mai liền nét", "weights": [400], "styles": ["normal"], "best_for": "Đèn uốn Neon Sign chữ ký"},
    {"id": "yellowtail", "name": "Yellowtail", "category": "script", "category_vn": "Retro Mỹ thập niên 50", "weights": [400], "styles": ["normal"], "best_for": "Burger, đồ nướng BBQ"},
    {"id": "kaushan-script", "name": "Kaushan Script", "category": "script", "category_vn": "Bút dạ dứt khoát", "weights": [400], "styles": ["normal"], "best_for": "Cà phê vỉa hè, trà đá"},
    {"id": "allura", "name": "Allura", "category": "script", "category_vn": "Mượt mà sang trọng", "weights": [400], "styles": ["normal"], "best_for": "Váy cưới, trang điểm cô dâu"},
    {"id": "courgette", "name": "Courgette", "category": "script", "category_vn": "Nghiêng vừa phải dễ đọc", "weights": [400], "styles": ["normal"], "best_for": "Quán ăn chay, thanh tịnh"},
    {"id": "cookie", "name": "Cookie", "category": "script", "category_vn": "Cổ điển thập niên 50", "weights": [400], "styles": ["normal"], "best_for": "Bánh quy, tiệm trà chiều"},
    {"id": "marck-script", "name": "Marck Script", "category": "script", "category_vn": "Bút máy duyên dáng", "weights": [400], "styles": ["normal"], "best_for": "Ký gửi, quà lưu niệm"},
    {"id": "parisienne", "name": "Parisienne", "category": "script", "category_vn": "Lãng mạn phong cách Paris", "weights": [400], "styles": ["normal"], "best_for": "Nước hoa, thời trang Pháp"},

    # 5. Slab Serif & Khối Hộp Công Nghiệp (10 fonts)
    {"id": "roboto-slab", "name": "Roboto Slab", "category": "slab", "category_vn": "Chân vuông hình học", "weights": [400, 600, 700, 900], "styles": ["normal"], "best_for": "Xây dựng, bất động sản, thầu"},
    {"id": "zilla-slab", "name": "Zilla Slab", "category": "slab", "category_vn": "Công nghệ sắc cạnh", "weights": [400, 600, 700], "styles": ["normal", "italic"], "best_for": "Kỹ thuật, tự động hóa"},
    {"id": "arvo", "name": "Arvo", "category": "slab", "category_vn": "Chân vuông cân xứng", "weights": [400, 700], "styles": ["normal", "italic"], "best_for": "Vật liệu xây dựng, sắt thép"},
    {"id": "rokkitt", "name": "Rokkitt", "category": "slab", "category_vn": "Biển báo dày đậm", "weights": [400, 600, 700, 900], "styles": ["normal"], "best_for": "Công trình ngoài trời"},
    {"id": "josefin-slab", "name": "Josefin Slab", "category": "slab", "category_vn": "Hình học cổ điển", "weights": [400, 600, 700], "styles": ["normal", "italic"], "best_for": "Kiến trúc sư, tư vấn phong thủy"},
    {"id": "biorhyme", "name": "BioRhyme", "category": "slab", "category_vn": "Mở rộng ngang lạ mắt", "weights": [400, 700, 800], "styles": ["normal"], "best_for": "Quán bar, không gian sáng tạo"},
    {"id": "crete-round", "name": "Crete Round", "category": "slab", "category_vn": "Chân tròn dịu mắt", "weights": [400], "styles": ["normal", "italic"], "best_for": "Văn phòng phẩm, sách"},
    {"id": "podkova", "name": "Podkova", "category": "slab", "category_vn": "Chữ móng ngựa cơ khí", "weights": [400, 600, 700, 800], "styles": ["normal"], "best_for": "Hàn xì, gia công kim khí"},
    {"id": "cutive", "name": "Cutive", "category": "slab", "category_vn": "Máy đánh chữ cổ điển", "weights": [400], "styles": ["normal"], "best_for": "Studio vintage, đồ da handmade"},
    {"id": "glegoo", "name": "Glegoo", "category": "slab", "category_vn": "Cân đối hiện đại", "weights": [400, 700], "styles": ["normal"], "best_for": "Biển cơ sở sản xuất, kho bãi"}
]

def get_fonts_catalog():
    """Lấy danh mục 100 font kèm kiểm tra các font tuỳ chỉnh bổ sung bên backend"""
    fonts = list(CORE_SIGNAGE_FONTS)
    
    # Kiểm tra font tuỳ chỉnh người dùng bỏ thêm vào thư mục backend/custom_fonts
    custom_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "custom_fonts")
    if os.path.exists(custom_dir):
        for f in os.listdir(custom_dir):
            if f.lower().endswith(('.ttf', '.otf', '.woff')):
                fid = os.path.splitext(f)[0].lower().replace(" ", "-")
                fname = os.path.splitext(f)[0].replace("-", " ").replace("_", " ").title()
                fonts.append({
                    "id": fid,
                    "name": f"{fname} (Custom Backend)",
                    "category": "custom",
                    "category_vn": "Font tuỳ chỉnh Backend",
                    "weights": [400, 700],
                    "styles": ["normal", "italic"],
                    "best_for": "Font riêng tải lên từ xưởng",
                    "file_name": f
                })
    return fonts
