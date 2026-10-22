import sys
import re
from bs4 import BeautifulSoup

sys.path.append('/root/admake/backend')
from models import app, db, MaterialSupplier, generate_datetime_id

raw_html = """
<div class="div_list_cty">
         	  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">1</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1188025080/vat-tu-quang-cao-quang-vinh-cong-ty-tnhh-thuong-mai-vat-tu-quang-cao-quang-vinh.html">Vật Tư Quảng Cáo Quang Vinh - Công Ty TNHH Thương Mại Vật Tư Quảng Cáo Quang Vinh</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-b tvx-b-sp"><span class="tvx-dia"><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i></span><span class="tvx-bar"></span><span class="tvx-splbl">Tài trợ</span></span>
                                    <span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="border border-dark-subtle rounded-2 mt-1 p-2 mb-3 text-center logo_congty">
                                    	<img style="width:100%; max-height:98px" alt="Vật Tư Quảng Cáo Quang Vinh - Công Ty TNHH Thương Mại Vật Tư Quảng Cáo Quang Vinh" src="https://logo.trangvangvietnam.com/L39578930900.gif">
                                    </div>
                                    <div class="logo_congty_diachi">
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo </span></div>
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><small>Thôn Hu Trì (Tại Nhà Ông Vũ Văn Minh), Xã Vĩnh Bảo, <span class="fw500">TP. Hải Phòng</span>, Việt Nam</small></div>
                                        <div class="pt-0 pb-2 ps-3 pe-4 listing_dienthoai">
                                        
                                         	<i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
											
												<a href="tel:0911108168">0911 108 168</a>
                                        </div>
                                        
                                        <div class="pt-0 pb-2 ps-3 pe-4"><i class="fa fa-solid fa-mobile-screen-button pe-1 text-black-50"></i> Hotline: <span class="fw500"><a href="tel:0911108168">0911 108 168</a></span> <a target="_blank" href="https://zalo.me/0911108168"><img src="https://trangvangvietnam.com/images/zalo_txt.png"></a></div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-0 mt-2">
                            <div class="cach_truoc"></div>
                        	<div class="div_textqc">
                            	<small class="text_qc">
                            	<b>Quang Vinh</b> - 5 năm chuyên sản xuất và cung cấp đa dạng <b><i>vật tư quảng cáo</i></b> chất lượng cao.
<br>✤ Bạt in quảng cáo
<br>✤ Đề can (Decal) quảng cáo
<br>✤ Mực in quảng cáo.
<br><b><u>Cam Kết Vàng Từ Quang Vinh</u>:</b>
<br>✪ Cam kết 100% sản phẩm đạt tiêu chuẩn kỹ thuật, được kiểm định khắt khe.
<br>✪ Là nhà sản xuất trực tiếp, chúng tôi mang đến mức giá gốc tận xưởng.
<br>✪ Đảm bảo khả năng cung ứng liên tục, đáp ứng mọi đơn hàng gấp.
<br>✪ Đội ngũ tư vấn sẵn sàng hỗ trợ 24/7 và chính sách giao hàng linh hoạt toàn quốc.
                            	</small>
                            </div>
                            <p class="clearfix m-0"></p>
                        </div>
                        
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395789309/Hinh-anh-xuong-san-xuat-kho-hang-cong-ty-Quang-vinh8.jpg" src="https://pic.trangvangvietnam.com/pics_low/395789309/Hinh-anh-xuong-san-xuat-kho-hang-cong-ty-Quang-vinh8.jpg" title="HÌNH ẢNH SẢN XUẤT VÀ KHO HÀNG CÔNG TY QUẢNG CÁO QUANG VINH" alt="Hình ảnh sản xuất và kho hàng công ty Quảng Cáo Quang Vinh">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395789309/hinh-anh-nha-xuong-kho-hang12(2).jpg" src="https://pic.trangvangvietnam.com/pics_low/395789309/hinh-anh-nha-xuong-kho-hang12(2).jpg" title="HÌNH ẢNH SẢN XUẤT VÀ KHO HÀNG CÔNG TY QUẢNG CÁO QUANG VINH" alt="Hình ảnh sản xuất và kho hàng công ty Quảng Cáo Quang Vinh">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395789309/hinh-anh-nha-xuong-kho-hang12(4).jpg" src="https://pic.trangvangvietnam.com/pics_low/395789309/hinh-anh-nha-xuong-kho-hang12(4).jpg" title="HÌNH ẢNH SẢN XUẤT VÀ KHO HÀNG CÔNG TY QUẢNG CÁO QUANG VINH" alt="Hình ảnh sản xuất và kho hàng công ty Quảng Cáo Quang Vinh">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395789309/hinh-anh-nha-xuong-kho-hang12(7).jpg" src="https://pic.trangvangvietnam.com/pics_low/395789309/hinh-anh-nha-xuong-kho-hang12(7).jpg" title="HÌNH ẢNH SẢN XUẤT VÀ KHO HÀNG CÔNG TY QUẢNG CÁO QUANG VINH" alt="Hình ảnh sản xuất và kho hàng công ty Quảng Cáo Quang Vinh">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395789309/hinh-anh-nha-xuong-kho-hang12(9).jpg" src="https://pic.trangvangvietnam.com/pics_low/395789309/hinh-anh-nha-xuong-kho-hang12(9).jpg" title="HÌNH ẢNH SẢN XUẤT VÀ KHO HÀNG CÔNG TY QUẢNG CÁO QUANG VINH" alt="Hình ảnh sản xuất và kho hàng công ty Quảng Cáo Quang Vinh">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395789309/hinh-anh-nha-xuong-kho-hang12(10).jpg" src="https://pic.trangvangvietnam.com/pics_low/395789309/hinh-anh-nha-xuong-kho-hang12(10).jpg" title="HÌNH ẢNH SẢN XUẤT VÀ KHO HÀNG CÔNG TY QUẢNG CÁO QUANG VINH" alt="Hình ảnh sản xuất và kho hàng công ty Quảng Cáo Quang Vinh">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1188025080/vat-tu-quang-cao-quang-vinh-cong-ty-tnhh-thuong-mai-vat-tu-quang-cao-quang-vinh.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: congtyquangvinh2024@gmail.com" href="mailto:congtyquangvinh2024@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://quangcaoquangvinh.com.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.quangcaoquangvinh.com.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">2</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187809623/vat-tu-quang-cao-hoang-hung-pro-cong-ty-tnhh-hoang-hung-pro.html">Vật Tư Quảng Cáo Hoàng Hưng Pro - Công Ty TNHH Hoàng Hưng Pro</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-b tvx-b-sp"><span class="tvx-dia"><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i></span><span class="tvx-bar"></span><span class="tvx-splbl">Tài trợ</span></span>
                                    <span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="border border-dark-subtle rounded-2 mt-1 p-2 mb-3 text-center logo_congty">
                                    	<img style="width:100%; max-height:98px" alt="Vật Tư Quảng Cáo Hoàng Hưng Pro - Công Ty TNHH Hoàng Hưng Pro" src="https://logo.trangvangvietnam.com/L39571749000-2.gif">
                                    </div>
                                    <div class="logo_congty_diachi">
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo </span></div>
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><small>468 Đường Bà Triệu, Phường Hạc Thành, <span class="fw500">Thanh Hóa</span>, Việt Nam</small></div>
                                        <div class="pt-0 pb-2 ps-3 pe-4 listing_dienthoai">
                                        
                                         	<i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
											
												<a href="tel:02373729297">(0237) 3729 297</a>
                                        </div>
                                        
                                        <div class="pt-0 pb-2 ps-3 pe-4"><i class="fa fa-solid fa-mobile-screen-button pe-1 text-black-50"></i> Hotline: <span class="fw500"><a href="tel:0982750770">0982 750 770</a></span> <a target="_blank" href="https://zalo.me/0982750770"><img src="https://trangvangvietnam.com/images/zalo_txt.png"></a></div>
                                        
                                        <div class="pt-0 pb-3 ps-3 pe-4"><small><b>Địa chỉ kho:</b> Lô 2 Khu D, Khu Công Nghiệp Tây Bắc Ga, Phường Hàm Rồng, TP. Thanh Hóa</small></div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-0 mt-2">
                            <div class="cach_truoc"></div>
                        	<div class="div_textqc">
                            	<small class="text_qc">
                            	<b><i>Hoàng Hưng Pro chuyên cung cấp vật tư ngành Quảng cáo - Nội thất như:</i></b>
<br><i>- Tấm ốp nhôm Aluminium thương hiệu Alcorest - Việt Dũng, ALU: VERMAX, VERTU - GIA PHÁT
<br>- Tấm mica, tấm fomex, Tấm ốp vân đá PVC, tấm nano, tấm gỗ nhựa Picomat
<br>- Tấm lợp thông minh, Tấm Xi Măng DURAflex, Tấm Cemboard SCG
<br>- Vách ngăn vệ sinh compact hpl, vách ngăn Panel
<br>- Standee, giá chữ X, banner cuốn, biển chức danh, ke inox,..</i>
<br><b><span style="text-transform:uppercase"> <u>Lý do nên chọn Hoàng Hưng Pro</u>:</span></b>
<br>✅ Sự chuyên môn hóa trong từng bộ phận, tính trách nhiệm cao cùng những tư vấn kỹ thuật làm việc nghiêm túc, cẩn thận nhằm tạo nên những sản phẩm hoàn thiện đến từng chi tiết nhỏ nhất.
<br>✅ Cam kết sản phẩm, dịch vụ có chất lượng cao, tiến độ giao hàng đảm bảo, giá thành hợp lý nhằm đáp ứng yêu cầu và nhu cầu khác nhau của khách hàng.
                            	</small>
                            </div>
                            <p class="clearfix m-0"></p>
                        </div>
                        
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395717490/vat-lieu-QC-(1).jpg" src="https://pic.trangvangvietnam.com/pics_low/395717490/vat-lieu-QC-(1).jpg" title="NẸP INOX V" alt="Nẹp inox V">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395717490/vat-lieu-QC-(3).jpg" src="https://pic.trangvangvietnam.com/pics_low/395717490/vat-lieu-QC-(3).jpg" title="NẸP INOX T" alt="Nẹp inox T">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395717490/z5405215894030.jpg" src="https://pic.trangvangvietnam.com/pics_low/395717490/z5405215894030.jpg" title="TẤM ỐP NHÔM NHỰA" alt="Tấm ốp nhôm nhựa">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395717490/z5405215929106.jpg" src="https://pic.trangvangvietnam.com/pics_low/395717490/z5405215929106.jpg" title="TẤM ỐP NHÔM NHỰA" alt="Tấm ốp nhôm nhựa">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395717490/z5405215929107.jpg" src="https://pic.trangvangvietnam.com/pics_low/395717490/z5405215929107.jpg" title="TẤM ỐP NHÔM NHỰA" alt="Tấm ốp nhôm nhựa">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187809623/vat-tu-quang-cao-hoang-hung-pro-cong-ty-tnhh-hoang-hung-pro.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: hoanghung.vtqc@gmail.com" href="mailto:hoanghung.vtqc@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://hoanghungpro.com.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.hoanghungpro.com.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">3</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1229220/dat-thai-son-cong-ty-tnhh-mot-thanh-vien-san-xuat-thuong-mai-dich-vu-dat-thai-son.html">Đạt Thái Sơn - Công Ty TNHH Một Thành Viên Sản Xuất Thương Mại Dịch Vụ Đạt Thái Sơn</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-b tvx-b-sp"><span class="tvx-dia"><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i></span><span class="tvx-bar"></span><span class="tvx-splbl">Tài trợ</span></span>
                                    
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="border border-dark-subtle rounded-2 mt-1 p-2 mb-3 text-center logo_congty">
                                    	<img style="width:100%; max-height:98px" alt="Đạt Thái Sơn - Công Ty TNHH Một Thành Viên Sản Xuất Thương Mại Dịch Vụ Đạt Thái Sơn" src="https://logo.trangvangvietnam.com/L19068900.gif">
                                    </div>
                                    <div class="logo_congty_diachi">
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo </span></div>
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><small>259 Nguyễn Thượng Hiền, P. 6, Q. Bình Thạnh, <span class="fw500">TP. Hồ Chí Minh</span>, Việt Nam</small></div>
                                        <div class="pt-0 pb-2 ps-3 pe-4 listing_dienthoai">
                                        
                                         	<i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
											
												<a href="tel:02835500206">(028) 35500206</a>
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-0 mt-2">
                            <div class="cach_truoc"></div>
                        	<div class="div_textqc">
                            	<small class="text_qc">
                            	Với tiêu chí là "Bạn của nhà Quảng Cáo", Đạt Thái Sơn mang tới cho khách hàng những sản phẩm đạt tiêu chuẩn chất lượng quốc tế.                                                                                                                                                                                                      
                            	</small>
                            </div>
                            <p class="clearfix m-0"></p>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: thongtin@datthaison.com.vn" href="mailto:thongtin@datthaison.com.vn"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://www.datthaison.com.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.datthaison.com.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">4</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187791926/quang-cao-m&amp;j-viet-nam-cong-ty-tnhh-quang-cao-xuat-nhap-khau-m&amp;j-viet-nam.html">Quảng Cáo M&amp;J Việt Nam - Công Ty TNHH Quảng Cáo Xuất Nhập Khẩu M&amp;J Việt Nam</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-b tvx-b-sp"><span class="tvx-dia"><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i></span><span class="tvx-bar"></span><span class="tvx-splbl">Tài trợ</span></span>
                                    <span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="border border-dark-subtle rounded-2 mt-1 p-2 mb-3 text-center logo_congty">
                                    	<img style="width:100%; max-height:98px" alt="Quảng Cáo M&amp;J Việt Nam - Công Ty TNHH Quảng Cáo Xuất Nhập Khẩu M&amp;J Việt Nam" src="https://logo.trangvangvietnam.com/L39571159100.gif">
                                    </div>
                                    <div class="logo_congty_diachi">
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo </span></div>
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><small>409/13A, Đường TCH13, P. Tân Chánh Hiệp, Q. 12, <span class="fw500">TP. Hồ Chí Minh</span>, Việt Nam</small></div>
                                        <div class="pt-0 pb-2 ps-3 pe-4 listing_dienthoai">
                                        
                                         	<i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
											
												<a href="tel:02862592067">(028) 6259 2067</a>, 
												<a href="tel:0981261200"> 0981 261 200</a>
                                        </div>
                                        
                                        <div class="pt-0 pb-2 ps-3 pe-4"><i class="fa fa-solid fa-mobile-screen-button pe-1 text-black-50"></i> Hotline: <span class="fw500"><a href="tel:0932781774">0932 781 774</a></span> <a target="_blank" href="https://zalo.me/0932781774"><img src="https://trangvangvietnam.com/images/zalo_txt.png"></a></div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-0 mt-2">
                            <div class="cach_truoc"></div>
                        	<div class="div_textqc">
                            	<small class="text_qc">
                            	Công Ty M&amp;J đã có gần 10 năm kinh nghiệm chuyên: 
<br>-  Cung cấp nguyên vật liệu quảng cáo được nhập khẩu trực tiếp tại Hàn Quốc
<br>-  Phân phối máy uốn chữ tự động hàng đầu của công ty SDS Hàn Quốc
<br>✓ M&amp;J sẽ mang đến những sản phẩm bền, đẹp, chất lượng cho quý khách
<br>✓ Đội ngũ tư vấn nhiệt tình sẽ giúp quý khách chọn được những option phù hợp.

                            	</small>
                            </div>
                            <p class="clearfix m-0"></p>
                        </div>
                        
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395711591/may uon (1).jpg" src="https://pic.trangvangvietnam.com/pics_low/395711591/may-uon-(1).jpg" title="MÁY UỐN CHỮ TỰ ĐỘNG" alt="Máy uốn chữ tự động">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395711591/may uon (3).jpg" src="https://pic.trangvangvietnam.com/pics_low/395711591/may-uon-(3).jpg" title="MÁY UỐN CHỮ TỰ ĐỘNG" alt="Máy uốn chữ tự động">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395711591/may uon (5).jpg" src="https://pic.trangvangvietnam.com/pics_low/395711591/may-uon-(5).jpg" title="MÁY UỐN CHỮ TỰ ĐỘNG" alt="Máy uốn chữ tự động">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395711591/vat tu quang cao (9).jpg" src="https://pic.trangvangvietnam.com/pics_low/395711591/vat-tu-quang-cao-(9).jpg" title="VẬT TƯ NGÀNH QUẢNG CÁO" alt="Vật tư ngành quảng cáo">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395711591/vat tu quang cao (1).jpg" src="https://pic.trangvangvietnam.com/pics_low/395711591/vat-tu-quang-cao-(1).jpg" title="VẬT TƯ NGÀNH QUẢNG CÁO" alt="Vật tư ngành quảng cáo">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395711591/vat tu quang cao (8).jpg" src="https://pic.trangvangvietnam.com/pics_low/395711591/vat-tu-quang-cao-(8).jpg" title="VẬT TƯ NGÀNH QUẢNG CÁO" alt="Vật tư ngành quảng cáo">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187791926/quang-cao-m&amp;j-viet-nam-cong-ty-tnhh-quang-cao-xuat-nhap-khau-m&amp;j-viet-nam.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: mjvn2016@gmail.com" href="mailto:mjvn2016@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://quangcaomj.com"><i class="fa fa-solid fa-globe pe-1"></i>www.quangcaomj.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">5</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187710548/in-an-quang-cao-quang-hung-cong-ty-tnhh-mot-thanh-vien-in-an-quang-hung.html">In ấn Quảng Cáo Quang Hưng - Công Ty TNHH Một Thành Viên In ấn Quang Hưng</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-b tvx-b-sp"><span class="tvx-dia"><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i></span><span class="tvx-bar"></span><span class="tvx-splbl">Tài trợ</span></span>
                                    <span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="border border-dark-subtle rounded-2 mt-1 p-2 mb-3 text-center logo_congty">
                                    	<img style="width:100%; max-height:98px" alt="In ấn Quảng Cáo Quang Hưng - Công Ty TNHH Một Thành Viên In ấn Quang Hưng" src="https://logo.trangvangvietnam.com/L39568446500.gif">
                                    </div>
                                    <div class="logo_congty_diachi">
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo </span></div>
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><small>393/5 Trần Hưng Đạo, Phường Cầu Ông Lãnh TP. Hồ Chí Minh, Việt Nam</small></div>
                                        <div class="pt-0 pb-2 ps-3 pe-4 listing_dienthoai">
                                        
                                         	<i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
											
												<a href="tel:0906030286">0906 030 286</a>
                                        </div>
                                        
                                        <div class="pt-0 pb-2 ps-3 pe-4"><i class="fa fa-solid fa-mobile-screen-button pe-1 text-black-50"></i> Hotline: <span class="fw500"><a href="tel:0906030286">0906 030 286</a></span> <a target="_blank" href="https://zalo.me/0906030286"><img src="https://trangvangvietnam.com/images/zalo_txt.png"></a></div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-0 mt-2">
                            <div class="cach_truoc"></div>
                        	<div class="div_textqc">
                            	<small class="text_qc">
                            	<b>In Ấn Quang Hưng</b> là công ty chuyên sản xuất và in ấn các mẫu <b><i>ấn phẩm quảng cáo, POSM</i></b> với đa dạng thiết kế, thu hút, bắt mắt và hiệu quả. Với: 
<br>➥ Đội ngũ thiết kế và công nhân thi công lành nghề, hoàn thiện sản phẩm với chất lượng cao nhất
<br>➥ Thiết kế ấn tượng, thu hút và bắt mắt, làm nổi bật sản phẩm quảng cáo 
<br>➥ Diện tích nhà xưởng rộng lớn, máy móc hiện đại - Sẵn sàng đáp ứng mọi số lượng, mọi mẫu mã
<br>➥ Chất liệu sản phẩm đa dạng, cứng cáp và bền đẹp.
                            	</small>
                            </div>
                            <p class="clearfix m-0"></p>
                        </div>
                        
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395684465/logo-mu-bao-hiem.jpg" src="https://pic.trangvangvietnam.com/pics_low/395684465/logo-mu-bao-hiem.jpg" title="SẢN XUẤT LOGO GẮN MŨ BẢO HIỂM" alt="Sản xuất Logo gắn mũ bảo hiểm">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395684465/Mascot-chat-lieu-fomex.jpg" src="https://pic.trangvangvietnam.com/pics_low/395684465/Mascot-chat-lieu-fomex.jpg" title="MASCOT CHẤT LIỆU FOMEX" alt="Mascot chất liệu fomex">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395684465/san-xuat-co-day.jpg" src="https://pic.trangvangvietnam.com/pics_low/395684465/san-xuat-co-day.jpg" title="SẢN XUẤT CỜ DÂY QUẢNG CÁO" alt="Sản xuất cờ dây quảng cáo">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395684465/san-xuat-tray-trung-bay-ke-sieu-thi.jpg" src="https://pic.trangvangvietnam.com/pics_low/395684465/san-xuat-tray-trung-bay-ke-sieu-thi.jpg" title="SẢN XUẤT TRAY TRƯNG BÀY KỆ SIÊU THỊ" alt="Sản xuất tray trưng bày kệ siêu thị">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395684465/Tent-card-Karofi-suc-khoe.jpg" src="https://pic.trangvangvietnam.com/pics_low/395684465/Tent-card-Karofi-suc-khoe.jpg" title="MẪU TENT CARD KAROFI SỨC KHỎE DÀI LÂU" alt="Mẫu Tent card Karofi sức khỏe dài lâu">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395684465/Tent-card-Logitech.jpg" src="https://pic.trangvangvietnam.com/pics_low/395684465/Tent-card-Logitech.jpg" title="MẪU TENT CARD SẢN PHẨM LOGITECH" alt="Mẫu Tent card sản phẩm Logitech">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187710548/in-an-quang-cao-quang-hung-cong-ty-tnhh-mot-thanh-vien-in-an-quang-hung.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: congtysanxuatwobbler@gmail.com" href="mailto:congtysanxuatwobbler@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://sanxuatwobbler.com"><i class="fa fa-solid fa-globe pe-1"></i>www.sanxuatwobbler.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">6</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187862384/may-cat-khac-laser-chanxan-cong-ty-tnhh-laser-chanxan.html">Máy Cắt Khắc Laser Chanxan - Công Ty TNHH Laser Chanxan</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-b tvx-b-sp"><span class="tvx-dia"><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i></span><span class="tvx-bar"></span><span class="tvx-splbl">Tài trợ</span></span>
                                    <span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="border border-dark-subtle rounded-2 mt-1 p-2 mb-3 text-center logo_congty">
                                    	<img style="width:100%; max-height:98px" alt="Máy Cắt Khắc Laser Chanxan - Công Ty TNHH Laser Chanxan" src="https://logo.trangvangvietnam.com/L39573507700.gif">
                                    </div>
                                    <div class="logo_congty_diachi">
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo </span></div>
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><small>80A/5, Tổ 4, Khu Phố 4, Phường An Phú, <span class="fw500">TP. Hồ Chí Minh</span>, Việt Nam</small></div>
                                        <div class="pt-0 pb-2 ps-3 pe-4 listing_dienthoai">
                                        
                                         	<i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
											
												<a href="tel:0354042596">0354 042 596</a>
                                        </div>
                                        
                                        <div class="pt-0 pb-2 ps-3 pe-4"><i class="fa fa-solid fa-mobile-screen-button pe-1 text-black-50"></i> Hotline: <span class="fw500"><a href="tel:0354042596">0354 042 596</a></span> <a target="_blank" href="https://zalo.me/0354042596"><img src="https://trangvangvietnam.com/images/zalo_txt.png"></a></div>
                                        
                                        <div class="pt-0 pb-3 ps-3 pe-4"><small><b>Miền Bắc:</b> Liêm Xuyên, Song Khê, Tp Bắc Giang</small></div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-0 mt-2">
                            <div class="cach_truoc"></div>
                        	<div class="div_textqc">
                            	<small class="text_qc">
                            	<span style=" text-transform:uppercase"> chúng tôi cung cấp các loại máy  móc, thiết bị phục vụ trong ngành quảng áo, in ấn</span>
<br> −  Máy cắt, khắc laser CO2: Máy cắt vải, da, mica, gỗ, giấy, MDF, nhựa PVC, cắt thiệp, máy khắc trái cây, dưa hấu, dừa…
<br> − Máy khắc laser, máy khắc tự động, máy khắc đầu tự động thay đổi,..
<br><u>Ưu điểm</u>: 
<br>✚ Nhà máy tiêu chuẩn hiện đại hóa hơn 5.000m2.
<br>✚ Có đội ngũ nghiên cứu độc lập, làm chủ công nghệ, phát triển sản phẩm dòng SG, dòng CW,.. 

                            	</small>
                            </div>
                            <p class="clearfix m-0"></p>
                        </div>
                        
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395735077/may cat laser kho lon CW-1625.png" src="https://pic.trangvangvietnam.com/pics_low/395735077/may-cat-laser-kho-lon-CW-1625.jpg" title="MÁY CẮT LASER KHỔ LỚN CW-1625" alt="Máy cắt laser khổ lớn CW-1625">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395735077/may cat laser.jpg" src="https://pic.trangvangvietnam.com/pics_low/395735077/may-cat-laser.jpg" title="MÁY CẮT LASER" alt="Máy cắt laser">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395735077/may cat laser2.png" src="https://pic.trangvangvietnam.com/pics_low/395735077/may-cat-laser2.jpg" title="MÁY CẮT LASER" alt="Máy cắt laser">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395735077/may khac laser (1).jpg" src="https://pic.trangvangvietnam.com/pics_low/395735077/may-khac-laser-(1).jpg" title="MÁY KHẮC LASER" alt="Máy khắc laser">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395735077/may khac laser (2).jpg" src="https://pic.trangvangvietnam.com/pics_low/395735077/may-khac-laser-(2).jpg" title="MÁY KHẮC LASER" alt="Máy khắc laser">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395735077/may khac laser (3).jpg" src="https://pic.trangvangvietnam.com/pics_low/395735077/may-khac-laser-(3).jpg" title="MÁY KHẮC LASER" alt="Máy khắc laser">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187862384/may-cat-khac-laser-chanxan-cong-ty-tnhh-laser-chanxan.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: chanxan.vn@gmail.com" href="mailto:chanxan.vn@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://laserchanxan.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.laserchanxan.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">7</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187993694/vat-tu-quang-cao-va-tam-op-nhom-nhua-thuan-thien-cong-ty-tnhh-tmdv-thuan-thien.html">Vật Tư Quảng Cáo Và Tấm ốp Nhôm Nhựa Thuận Thiên - Công Ty TNHH TMDV Thuận Thiên</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-b tvx-b-sp"><span class="tvx-dia"><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i><i class="fa-solid fa-gem"></i></span><span class="tvx-bar"></span><span class="tvx-splbl">Tài trợ</span></span>
                                    <span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="border border-dark-subtle rounded-2 mt-1 p-2 mb-3 text-center logo_congty">
                                    	<img style="width:100%; max-height:98px" alt="Vật Tư Quảng Cáo Và Tấm ốp Nhôm Nhựa Thuận Thiên - Công Ty TNHH TMDV Thuận Thiên" src="https://logo.trangvangvietnam.com/L39577884700-002.gif">
                                    </div>
                                    <div class="logo_congty_diachi">
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo </span></div>
                                    	<div class="pt-0 pb-2 ps-3 pe-4"><small>330B/10, Đường Hoàng Quốc Việt, KV4, Phường An Bình, <span class="fw500">TP. Cần Thơ</span>, Việt Nam</small></div>
                                        <div class="pt-0 pb-2 ps-3 pe-4 listing_dienthoai">
                                        
                                         	<i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
											
												<a href="tel:0938128928">0938 128 928</a>
                                        </div>
                                        
                                        <div class="pt-0 pb-2 ps-3 pe-4"><i class="fa fa-solid fa-mobile-screen-button pe-1 text-black-50"></i> Hotline: <span class="fw500"><a href="tel:0938128928">0938 128 928</a></span> <a target="_blank" href="https://zalo.me/0938128928"><img src="https://trangvangvietnam.com/images/zalo_txt.png"></a></div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-0 mt-2">
                            <div class="cach_truoc"></div>
                        	<div class="div_textqc">
                            	<small class="text_qc">
                            	<center> <span style=" text-transform:uppercase"><b>Thuận Thiên - Chất Lượng Tạo Thương Hiệu!</b></span> </center>
<b>Công Ty TNHH TMDV Thuận Thiên</b> đem đến cho quý khách hàng đa dạng các sự lựa chọn về các loại <b>vật tư quảng cáo</b>:

<br>☑ Sản phẩm chất lượng cao, đáp ứng chính xác các tiêu chuẩn về kỹ thuật và tính thẩm mỹ
<br>☑ Đa dạng chủng loại, mẫu mã, phục vụ mọi nhu cầu khác nhau của khách hàng
<br>☑ Giá cả hợp lý, cạnh tranh cùng với nhiều ưu đãi hấp dẫn.
                            	</small>
                            </div>
                            <p class="clearfix m-0"></p>
                        </div>
                        
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395778847/PVC gia da-gia gach.jpg" src="https://pic.trangvangvietnam.com/pics_low/395778847/PVC-gia-da-gia-gach.jpg" title="TẤM ỐP TƯỜNG PVC GIẢ ĐÁ GIẢ GẠCH" alt="Tấm ốp tường PVC giả đá giả gạch">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395778847/tam-nhua Fomex-Foam-PVA Fomex (1).jpg" src="https://pic.trangvangvietnam.com/pics_low/395778847/tam-nhua-Fomex-Foam-PVA-Fomex-(1).jpg" title="TẤM NHỰA FOMEX FOAM PVA FOMEX" alt="Tấm nhựa Fomex Foam PVA Fomex">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395778847/PVC van da.jpg" src="https://pic.trangvangvietnam.com/pics_low/395778847/PVC-van-da.jpg" title="TẤM ỐP TƯỜNG PVC VÂN ĐÁ" alt="Tấm ốp tường PVC vân đá">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395778847/Mica mau-mica dai loan.jpg" src="https://pic.trangvangvietnam.com/pics_low/395778847/Mica-mau-mica-dai-loan.jpg" title="MICA MÀU - MICA ĐÀI LOAN" alt="Mica màu - Mica Đài Loan">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395778847/tam-lop-lay-sangg (1).jpg" src="https://pic.trangvangvietnam.com/pics_low/395778847/tam-lop-lay-sangg-(1).jpg" title="TẤM LỢP LẤY SÁNG" alt="Tấm lợp lấy sáng">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395778847/tam-lop-lay-sangg (2).jpg" src="https://pic.trangvangvietnam.com/pics_low/395778847/tam-lop-lay-sangg-(2).jpg" title="TẤM LỢP LẤY SÁNG" alt="Tấm lợp lấy sáng">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187993694/vat-tu-quang-cao-va-tam-op-nhom-nhua-thuan-thien-cong-ty-tnhh-tmdv-thuan-thien.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: thuanthien.vtqc@gmail.com" href="mailto:thuanthien.vtqc@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://alu-mica-polytt.com"><i class="fa fa-solid fa-globe pe-1"></i>www.alu-mica-polytt.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">8</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187820633/cn-tphcm-cong-ty-cp-ky-thuat-so-sbc.html">CN TPHCM - Công Ty CP Kỹ Thuật Số SBC</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 10/5/2022</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>182C Lê Thị Bạch Cát, P. 11, Q. 11, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0975843333">0975843333</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: info@sbcvietnam.com" href="mailto:info@sbcvietnam.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://thegioimayin.com"><i class="fa fa-solid fa-globe pe-1"></i>www.thegioimayin.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">9</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187803077/chi-nhanh-cong-ty-cp-ky-thuat-so-sbc-tai-da-nang.html">Chi Nhánh Công Ty CP Kỹ Thuật Số SBC Tại Đà Nẵng</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 8/6/2022</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>85-87 Võ Chí Công, P. Hòa Xuân, Q. Cẩm Lệ, <strong>Tp. Đà Nẵng</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0905658288">0905658288</a>, 
                                                            <a href="tel:0976426796">0976426796</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: info@sbcvietnam.com" href="mailto:info@sbcvietnam.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://thegioimayin.com"><i class="fa fa-solid fa-globe pe-1"></i>www.thegioimayin.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">10</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1041843/doanh-nghiep-tu-nhan-gia-linh.html">Doanh Nghiệp Tư Nhân Gia Linh</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 7/3/2025</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>178/9 Phạm Văn Chí, P. 4, Q. 6, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02839675926">(028) 39675926</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: vattuquangcao178@gmail.com" href="mailto:vattuquangcao178@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://gialinhpte.com"><i class="fa fa-solid fa-globe pe-1"></i>www.gialinhpte.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">11</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187760513/vat-tu-thiet-bi-quang-cao-carina-cong-ty-tnhh-tu-van-xay-dung-va-phat-trien-ced-viet-nam.html">Vật Tư Thiết Bị Quảng Cáo Carina - Công Ty TNHH Tư Vấn Xây Dựng Và Phát Triển CED Việt Nam</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 19/6/2020</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 11 Ngõ 2 Phố Hoàng Sâm, P. Nghĩa Đô, Q. Cầu Giấy, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02435666829">(024) 35666829</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: thietbiquangcao71@gmail.com" href="mailto:thietbiquangcao71@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://carinagroup.com.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.carinagroup.com.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">12</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1297122/cong-ty-tnhh-thuong-mai-ky-thuat-thl.html">Công Ty TNHH Thương Mại Kỹ Thuật THL</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 1/7/2019</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>67A Phùng Chí Kiên, P. Nghĩa Đô, Q. Cầu Giấy, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02435162228">(024) 35162228</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: congtythl@gmail.com" href="mailto:congtythl@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">13</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187677482/cong-ty-tnhh-dau-tu-quoc-te-viet-nam.html">Công Ty TNHH Đầu Tư Quốc Tế Việt Nam</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 20/8/2024</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 2010, Tòa CT3A, KĐT Văn Quán, Q. Hà Đông, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02435666727">(024) 35666727</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: maycncnhatban@gmail.com" href="mailto:maycncnhatban@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://vinco.com.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.vinco.com.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">14</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187736276/nhua-bao-tin-cong-ty-tnhh-nhua-bao-tin.html">Nhựa Bảo Tín - Công Ty TNHH Nhựa Bảo Tín</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 12/1/2023</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>36 Quốc Lộ 22, Ấp Đông Lân, X. Bà Điểm, H. Hóc Môn, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02835920958">(028) 35920958</a>, 
                                                            <a href="tel:0909405019"> 0909405019</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: nhuabaotin@gmail.com" href="mailto:nhuabaotin@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://micabaotin.com"><i class="fa fa-solid fa-globe pe-1"></i>www.micabaotin.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">15</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187676063/cong-ty-tnhh-thuong-mai-kha-loi.html">Công Ty TNHH Thương Mại Khả Lợi</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 9/7/2020</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 256/34 Phan Huy ích, P. 12, Q. Gò Vấp, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02866843956">(028) 66843956</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: kinhdoanh.khaloi@gmail.com" href="mailto:kinhdoanh.khaloi@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://maycatdecal.khaloi.com"><i class="fa fa-solid fa-globe pe-1"></i>www.maycatdecal.khaloi.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">16</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187839104/cong-ty-tnhh-mtv-tm-dv-quang-cao-thien-an-phat.html">Công Ty TNHH MTV TM - DV Quảng Cáo Thiên Ân Phát</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 24/6/2020</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>247/1 KP.1A , P. An Phú, TP. Thuận An, <strong>Bình Dương</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02746547997">(0274) 6547997</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: thienan_design79@yahoo.com.vn" href="mailto:thienan_design79@yahoo.com.vn"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://quangcaothienanphat.com"><i class="fa fa-solid fa-globe pe-1"></i>www.quangcaothienanphat.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">17</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187828472/cong-ty-tnhh-thuong-mai-dang-viet.html">Công Ty TNHH Thương Mại Đằng Việt</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 21/11/2023</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 82 Bình Long, P. Phú Thạnh, Q. Tân Phú, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0908295903">0908 295 903</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: ctydangviet@gmail.com" href="mailto:ctydangviet@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://vatlieuinquangcao.bizz.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.vatlieuinquangcao.bizz.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">18</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187893608/cong-ty-tnhh-adg-viet-nam.html">Công Ty TNHH ADG Việt Nam</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 8/12/2025</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>11 Đường Số 47, Phường Khánh Hội, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02838362966">(028) 38362966</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: adgvn.vn@gmail.com" href="mailto:adgvn.vn@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://adgvn.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.adgvn.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">19</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1293000/cong-ty-tnhh-quang-cao-thuong-mai-cong-minh.html">Công Ty TNHH Quảng Cáo Thương Mại Công Minh</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 23/6/2020</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>B20 KĐT Trung Hòa - Nhân Chính, Q. Thanh Xuân, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0913546414">0913546414</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: congminhad@gmail.com" href="mailto:congminhad@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">20</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187790471/cong-ty-cp-cong-nghe-va-xuat-nhap-khau-asean.html">Công Ty CP Công Nghệ Và Xuất Nhập Khẩu Asean</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 18/5/2021</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 918 Đường Kim Giang, H. Thanh Trì, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0983821809">0983821809</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: aseanprinter@gmail.com" href="mailto:aseanprinter@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://aseanjsc.com.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.aseanjsc.com.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">21</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187817942/cong-ty-tnhh-mtv-in-an-quang-hung.html">Công Ty TNHH MTV In ấn Quang Hưng</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 21/6/2024</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>503 Lô B, CC 207, Đường Bùi Viện, P. Phạm Ngũ Lão, Q. 1, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02838361805">(028) 38361805</a>, 
                                                            <a href="tel:0906030286"> 0906030286</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395720263/hanger (11).jpg" src="https://pic.trangvangvietnam.com/pics_low/395720263/hanger-(11).jpg" title="SẢN XUẤT BANGRTREO MẪU VẢI NAM ANH" alt="Sản xuất bangrtreo mẫu vải Nam Anh">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395720263/moc treo  (2).jpg" src="https://pic.trangvangvietnam.com/pics_low/395720263/moc-treo--(2).jpg" title="MÓC NHỰA ĐỤC MÓC NHỰA HANGER GIẤY" alt="Móc nhựa đục móc nhựa hanger giấy">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395720263/btmvai (4).jpg" src="https://pic.trangvangvietnam.com/pics_low/395720263/btmvai-(4).jpg" title="HANGER GIẤY MÓC VẢI - VM FASHION" alt="Hanger giấy móc vải - VM Fashion">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395720263/hanger quang cao.jpg" src="https://pic.trangvangvietnam.com/pics_low/395720263/hanger-quang-cao.jpg" title="HANGER QUẢNG CÁO" alt="Hanger quảng cáo">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395720263/wobbler quang cao de ban.jpg" src="https://pic.trangvangvietnam.com/pics_low/395720263/wobbler-quang-cao-de-ban.jpg" title="WOBBLER QUẢNG CÁO ĐỂ BÀN" alt="Wobbler quảng cáo để bàn">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395720263/kep lo xo quang cao san xuat.jpg" src="https://pic.trangvangvietnam.com/pics_low/395720263/kep-lo-xo-quang-cao-san-xuat.jpg" title="KẸP LÒ XO QUẢNG CÁO SẢN XUẤT" alt="Kẹp lò xo quảng cáo sản xuất">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187817942/cong-ty-tnhh-mtv-in-an-quang-hung.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: congtysanxuatwobbler@gmail.com" href="mailto:congtysanxuatwobbler@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://sanxuatwobbler.com"><i class="fa fa-solid fa-globe pe-1"></i>www.sanxuatwobbler.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">22</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187781663/quang-cao-kim-tuong-cong-ty-tnhh-san-xuat-quang-cao-va-thuong-mai-kim-tuong.html">Quảng Cáo Kim Tưởng - Công Ty TNHH Sản Xuất Quảng Cáo và Thương Mại Kim Tưởng</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 19/3/2020</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>64/16 ĐTH 21, P. Đông Hưng Thuận, Q. 12, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02862609977">(028) 62609977</a>, 
                                                            <a href="tel:0989001289"> Hotline: 0989 001 289</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395708170/may-CNC-1325A-(2).jpg" src="https://pic.trangvangvietnam.com/pics_low/395708170/may-CNC-1325A-(2).jpg" title="MÁY CNC 1325A" alt="Máy CNC 1325A">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395708170/may-cat-gas-plasma-CNC-(2).jpg" src="https://pic.trangvangvietnam.com/pics_low/395708170/may-cat-gas-plasma-CNC-(2).jpg" title="MÁY CẮT GAS PLASMA CNC" alt="Máy cắt gas Plasma CNC">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395708170/gia-treo-pvc_large.jpg" src="https://pic.trangvangvietnam.com/pics_low/395708170/gia-treo-pvc_large.jpg" title="GIÁ TREO PVC" alt="Giá treo PVC">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395708170/ke-hop-kim-nhom_large.jpg" src="https://pic.trangvangvietnam.com/pics_low/395708170/ke-hop-kim-nhom_large.jpg" title="KỆ HỢP KIM" alt="Kệ hợp kim">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395708170/man-hinh-lcd_large.jpg" src="https://pic.trangvangvietnam.com/pics_low/395708170/man-hinh-lcd_large.jpg" title="MÀN HÌNH LCD" alt="Màn hình LCD">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395708170/bien-3-mat-01_large.png" src="https://pic.trangvangvietnam.com/pics_low/395708170/bien-3-mat-01_large.jpg" title="BIỂN BA MẶT" alt="Biển ba mặt">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187781663/quang-cao-kim-tuong-cong-ty-tnhh-san-xuat-quang-cao-va-thuong-mai-kim-tuong.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: admin@kimtuongadv.com" href="mailto:admin@kimtuongadv.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://kimtuongadv.com"><i class="fa fa-solid fa-globe pe-1"></i>www.kimtuongadv.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">23</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187789598/cong-ty-tnhh-thuong-mai-quoc-te-son-dong.html">Công Ty TNHH Thương Mại Quốc Tế Sơn Đông</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 9/7/2020</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 9, Ngõ 217 KCN La Phù, X. La Phù, H. Hoài Đức, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02432272614">(024) 32272614</a>, 
                                                            <a href="tel:0936271790"> Hotline: 0936271790</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                       
                        <div class="w-100 h-auto p-0 m-0 pt-2">
                        	<div class="cach_truoc"></div>
                            <div class="div_showimages">
                            	<div style="height: auto; clear:both">
                                	 
                                        <div class="border rounded-2 big_image p-1 image_show">
                                        		
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395710815/bat1.jpg" src="https://pic.trangvangvietnam.com/pics_low/395710815/bat1.jpg" title="BẠT HIFLEX" alt="Bạt Hiflex">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395710815/decal.jpg" src="https://pic.trangvangvietnam.com/pics_low/395710815/decal.jpg" title="DECAL IN" alt="Decal in">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395710815/mang can.jpg" src="https://pic.trangvangvietnam.com/pics_low/395710815/mang-can.jpg" title="MÀNG CÁN" alt="Màng cán">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395710815/nguon dien.jpg" src="https://pic.trangvangvietnam.com/pics_low/395710815/nguon-dien.jpg" title="NGUỒN ĐIỆN" alt="Nguồn điện">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show ">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395710815/pp.jpg" src="https://pic.trangvangvietnam.com/pics_low/395710815/pp.jpg" title="PP" alt="PP">
                                                     
                                        </div>
                                         
                                        <div class="border rounded-2 small_image p-1 image_show image_noshow">
												
                                                    <img loading="lazy" class="w-100 mh-100" data-full="https://pic.trangvangvietnam.com/395710815/tam formec.jpg" src="https://pic.trangvangvietnam.com/pics_low/395710815/tam-formec.jpg" title="TẤM FORMEC" alt="Tấm formec">
                                                     
                                        </div>
                                          
                                    <div class="position-relative xemchitiet_div pc_display">
                                    	<div class="h-auto w-100 position-absolute bottom-0 end-0 xemchitiet">
                                    	 <a href="https://trangvangvietnam.com/listings/1187789598/cong-ty-tnhh-thuong-mai-quoc-te-son-dong.html">+ Chi tiết...</a>
                                        </div> 
                                    </div>
                                </div>
                            </div>
                        </div>
                         
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: ctysondong16@gmail.com" href="mailto:ctysondong16@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">24</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187870289/cong-ty-tnhh-san-xuat-va-xuat-nhap-khau-admart.html">Công Ty TNHH Sản Xuất Và Xuất Nhập Khẩu ADMART</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 25/6/2020</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>234 Đường Nguyễn Văn Giáp, P. Cầu Diễn, Q. Nam Từ Liêm, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0789188689">0789188689</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: info@ad-martvietnam.com" href="mailto:info@ad-martvietnam.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://ad-martvietnam.com"><i class="fa fa-solid fa-globe pe-1"></i>www.ad-martvietnam.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">25</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/3688704/cong-ty-tnhh-quang-cao-minh-an.html">Công Ty TNHH Quảng Cáo Minh An</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 22/6/2021</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>1126 Đường 3/2, P. 12, Q. 11, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02839650361">(028) 39650361</a>, 
                                                            <a href="tel:0918090930"> 0918090930</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: quangcaominhan@gmail.com" href="mailto:quangcaominhan@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://quangcaominhan.com"><i class="fa fa-solid fa-globe pe-1"></i>www.quangcaominhan.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">26</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187851287/cong-ty-tnhh-thuong-mai-bac-dau.html">Công Ty TNHH Thương Mại Bắc Đẩu</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 10/1/2023</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>307 Lê Văn Thọ, P. 9, Q. Gò Vấp, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02862572319">(028) 62572319</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: bacdauhcm@gmail.com" href="mailto:bacdauhcm@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://bacdaustar.net"><i class="fa fa-solid fa-globe pe-1"></i>www.bacdaustar.net</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">27</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187816931/cong-ty-tnhh-xuat-nhap-khau-thiet-bi-ky-thuat-so-vuong-phat.html">Công Ty TNHH Xuất Nhập Khẩu Thiết Bị Kỹ Thuật Số Vương Phát</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 21/12/2023</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 100, Đường Tân Xuân, P. Đông Ngạc, Q. Bắc Từ Liêm, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02466855588">(024) 66855588</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: vuongphatdigital@gmail.com" href="mailto:vuongphatdigital@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://vuongphatdigital.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.vuongphatdigital.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">28</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187776077/cong-ty-co-phan-quang-cao-zodiac.html">Công Ty Cổ Phần Quảng Cáo Zodiac</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 13/7/2023</span><span class="tvx-vwrap"><span class="tvx-b tvx-b-vf"><i class="fa-solid fa-circle-check"></i> Xác thực<button type="button" class="tvx-info" aria-label="Xác thực nghĩa là gì?" onclick="tvxTip(this)">i</button></span><span class="tvx-tip" role="tooltip"><span class="tvx-tip-h"><span class="tvx-tip-hl"><i class="fa-solid fa-circle-check"></i> Thông tin đã được doanh nghiệp xác nhận</span><span class="tvx-tip-sub">Giúp bạn biết đây là doanh nghiệp đã đứng tên và tự xác nhận thông tin của mình — không ẩn danh.</span></span><span class="tvx-tip-b"><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã cung cấp mã số thuế và thông tin đăng ký kinh doanh</span><span><i class="fa-solid fa-check"></i> Doanh nghiệp đã ký xác nhận qua phiếu đăng ký có đóng dấu hoặc hợp đồng hợp tác với Trang Vàng Việt Nam</span></span><span class="tvx-tip-n">Thông tin do <b>doanh nghiệp cung cấp và chịu trách nhiệm</b>; Trang Vàng hỗ trợ đăng tải để bạn dễ tra cứu, <b>không đánh giá hay bảo chứng</b> chất lượng sản phẩm, dịch vụ hay giao dịch. Bạn nên <b>tìm hiểu thêm và xác minh</b> trước khi giao dịch.</span><a href="https://trangvangvietnam.com/xac-thuc" style="display:inline-block;margin-top:9px;font-size:12px;font-weight:700;color:#15803d;text-decoration:none">Xác thực là gì? →</a></span></span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>148 Nguyễn Hữu Dật, P. Tây Thạnh, Q. Tân Phú, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0918249879">0918249879</a>, 
                                                            <a href="tel:0913875849"> 0913875849</a>, 
                                                            <a href="tel:0946548811"> 0946548811</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: inktszodiac@gmail.com" href="mailto:inktszodiac@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://mayinktsaz.com"><i class="fa fa-solid fa-globe pe-1"></i>www.mayinktsaz.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">29</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187854578/cong-ty-co-phan-tap-doan-giai-phap-viet-nam.html">Công Ty Cổ Phần Tập Đoàn Giải Pháp Việt Nam</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 22/11/2024</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Tầng 3, Tòa Nhà 59 Quang Trung, P. Nguyễn Du, Q. Hai Bà Trưng, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02439764401">(024) 39764401</a>, 
                                                            <a href="tel:02439764402">(024)  39764402</a>   
                                        </div>
                                        
                                         <div class="p-2 ps-0 pe-4"><i class="fa fa-solid fa-mobile-screen-button pe-1 text-black-50"></i> Hotline: <span class="fw500"><a href="tel:0976602468">0976 602 468</a></span> <a target="_blank" href="https://zalo.me/0976602468"><img src="https://trangvangvietnam.com/images/zalo_txt.png"></a></div>
                                        
                                        <div class="pt-0 pb-3 ps-3 pe-4"><small><b>VP HCM</b>: Lầu 15 Vincom Center, 72 Lê Thánh Tôn, P. Bến Nghé, Q.1, Tp. HCM
<br><b>VP Đà Nẵng</b>: Tầng 3, Tòa Indochina, 74 Bạch Đằng, Q. Hải Châu, Đà Nẵng.</small></div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: hanoi@solution.com.vn" href="mailto:hanoi@solution.com.vn"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://solution.com.vn"><i class="fa fa-solid fa-globe pe-1"></i>www.solution.com.vn</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">30</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187856690/cong-ty-tnhh-dau-tu-phat-trien-va-xay-dung-dai-duong.html">Công Ty TNHH Đầu Tư Phát Triển Và Xây Dựng Đại Dương</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 12/1/2023</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>Số 179, Đê La Thành, Q. Đống Đa, <strong>Hà Nội</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02466748999">(024) 66748999</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: vatlieuquangcao.net@gmail.com" href="mailto:vatlieuquangcao.net@gmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="http://vatlieuquangcao.net"><i class="fa fa-solid fa-globe pe-1"></i>www.vatlieuquangcao.net</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">31</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/964095/cong-ty-tnhh-thuong-mai-san-xuat-van-su-loi.html">Công Ty TNHH Thương Mại - Sản Xuất Vạn Sự Lợi</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 19/10/2023</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>119-121 Đường Song Hành, P. 10, Q. 6, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:02837552222">(028) 37552222</a>, 
                                                            <a href="tel:02837553333">(028)  37553333</a>, 
                                                            <a href="tel:0907981111"> 0907981111</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: vansuloi@hotmail.com" href="mailto:vansuloi@hotmail.com"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                        <a rel="nofollow" target="_blank" href="https://vansuloi.com"><i class="fa fa-solid fa-globe pe-1"></i>www.vansuloi.com</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">32</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/119346222/quang-cao-manh-thai-cong-ty-tnhh-tm-dv-quang-cao-manh-thai.html">Quảng Cáo Mạnh Thái - Công Ty TNHH TM DV Quảng Cáo Mạnh Thái</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 5/4/2023</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
                        					 
                         <div class="w-100 h-auto p-0 m-0">
                         	 <div class="cach_truoc"></div>    
                        	 <div class="h-auto pt-0 div_logo_diachi">
                                	
                                    <div class="listing_diachi_nologo">
                                    	<div class="p-2 pt-0 ps-0 pe-4"><span class="nganh_listing"><i class="fa fa-solid fa-layer-group pe-1"></i>NGÀNH:</span> <span class="nganh_listing_txt fw500">vật tư quảng cáo</span></div>
                                    	<div class="p-2 pt-0 ps-0 pe-4"><small>425 Âu Cơ, P. Phú Trung, Q. Tân Phú, <strong>TP. Hồ Chí Minh</strong>, Việt Nam</small></div>
                                        <div class="p-2 pt-0 ps-0 pe-4 pb-0">
                                        
                                        		    <i class="fa fa-solid fa-phone-volume text-black-50 pe-1"></i> 
												    
                                                            <a href="tel:0913805164">0913805164</a>   
                                        </div>
                                        
                                    </div>
                                    
                                    <p class="m-0 clearfix"></p>
                                </div>
                         </div>
                        
                         <p class="clearfix m-0"></p>
                        
                         <div class="w-100 h-auto p-0 m-0 mt-4">
                            <div class="cach_truoc"></div>	
                                <div class="email_web_section">
                                
                                        <a title="Địa chỉ email: themanh@manhthaiad.vn" href="mailto:themanh@manhthaiad.vn"><i class="fa-regular fa-envelope pe-1"></i> Gửi Email</a>
                                        
                                </div>
                        </div>
                        
                    	<p class="p-2 m-0 clearfix"></p>
                    </div>
            		
                    <p class="m-0 clearfix"></p>
					  
            <div class="w-100 h-auto shadow rounded-3 bg-white p-2 mb-3 tvx-card">
                        <div class="w-100 h-auto p-0 m-0 pt-2">    
                            <div class="stt"><div class="stt_txt">33</div></div>	
                            <div class="tvx-cardhead">
                                <h2 class="tvx-cn"><a href="https://trangvangvietnam.com/listings/1187736255/cong-ty-tnhh-thuong-mai-dich-vu-san-xuat-top-ba.html">Công Ty TNHH Thương Mại Dịch Vụ Sản Xuất Tốp Ba</a></h2>
                                <div class="tvx-badges">
                                <span class="tvx-upd"><i class="fa fa-regular fa-clock"></i> Cập nhật gần nhất: 3/1/2025</span>
                                </div>
                            </div>
                            <p class="m-0 clearfix"></p>
                        </div>
            </div>
</div>
"""

soup = BeautifulSoup(raw_html, 'html.parser')
cards = soup.find_all('div', class_='tvx-card')
print(f"FOUND {len(cards)} TVX CARDS IN HTML.")

parsed_items = []

for idx, card in enumerate(cards, 1):
    # Name
    h2 = card.find('h2', class_='tvx-cn')
    a_title = h2.find('a') if h2 else None
    name = a_title.get_text(strip=True) if a_title else "N/A"
    listing_url = a_title.get('href') if a_title else None

    # Website
    website = None
    web_a = card.find('a', target='_blank', href=lambda h: h and ('http' in h or 'www' in h) and 'zalo' not in h and 'trangvang' not in h)
    if web_a:
        website = web_a['href'].strip()

    # Phone
    phone_links = card.find_all('a', href=lambda h: h and 'tel:' in h)
    phones = [p.get_text(strip=True) for p in phone_links if p.get_text(strip=True)]
    phone_str = ", ".join(phones) if phones else None

    # Address
    small_addr = card.find('small')
    addr_str = small_addr.get_text(strip=True) if small_addr else None

    parsed_items.append({
        "name": name,
        "website_link": website or listing_url, # Fallback to TrangVang listing link if website is not available
        "phone": phone_str,
        "address": addr_str
    })
    print(f"[{idx}] {name}")
    print(f"    Web  : {website or listing_url}")
    print(f"    Phone: {phone_str}")
    print(f"    Addr : {addr_str}")

with app.app_context():
    # 1. Delete ALL current suppliers as explicitly requested by user!
    deleted_rows = MaterialSupplier.query.delete()
    db.session.commit()
    print(f"\nDELETED ALL {deleted_rows} OLD SUPPLIERS FROM DB.")

    # 2. Insert new exact suppliers
    inserted_count = 0
    for item in parsed_items:
        sup = MaterialSupplier(
            id=f"sup_{generate_datetime_id()}",
            name=item['name'],
            website_link=item['website_link'],
            phone=item['phone'],
            address=item['address']
        )
        db.session.add(sup)
        inserted_count += 1

    db.session.commit()
    print(f"SUCCESS: Inserted {inserted_count} exact suppliers from Trang Vàng HTML into PostgreSQL DB!")
