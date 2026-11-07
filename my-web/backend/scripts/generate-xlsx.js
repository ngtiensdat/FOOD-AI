const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const dataDir = path.resolve(__dirname, '../../../data-import');

// Hàm tự động căn chỉnh độ rộng cột chuẩn: Luôn rộng hơn tên tiêu đề tối thiểu 4-6 ký tự
function calculateColumnWidths(data, customMaxCaps = {}) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);

  return keys.map((key) => {
    // Chiều rộng tối thiểu luôn bằng độ dài của tên cột + 5 ký tự đệm
    let maxLen = key.length + 5;

    for (const row of data) {
      if (row[key] !== undefined && row[key] !== null) {
        const valStr = String(row[key]);
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      }
    }

    const maxCap = customMaxCaps[key] || 55;
    const finalWidth = Math.min(Math.max(maxLen + 2, key.length + 5), maxCap);
    return { wch: finalWidth };
  });
}

// -------------------------------------------------------------
// 1. TẠO FILE khach_hang.xlsx (ĐẦY ĐỦ 100% CÁC TRƯỜNG DB)
// -------------------------------------------------------------
const customersData = [
  {
    email: 'khach1@test.com',
    mat_khau: '123456',
    ho_ten: 'Nguyễn Văn An',
    so_dien_thoai: '0900000001',
    dia_chi: '144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    so_thich_am_thuc: 'Cơm văn phòng, Món Việt, Đồ cay',
    muc_tieu_suc_khoe: 'muscle_gain',
    ngan_sach: 'TrungBinh',
    danh_hieu: 'Tín đồ ẩm thực',
    diem_thuong: 100,
    cap_do: 1,
    anh_dai_dien: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    anh_bia: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    tieu_su: 'Thích ăn ngon và tập gym tăng cơ',
  },
  {
    email: 'khach2@test.com',
    mat_khau: '123456',
    ho_ten: 'Trần Thị Mai',
    so_dien_thoai: '0900000002',
    dia_chi: 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
    so_thich_am_thuc: 'Ăn chay, Salad, Đồ thanh đạm',
    muc_tieu_suc_khoe: 'weight_loss',
    ngan_sach: 'TietKiem',
    danh_hieu: 'Ăn sạch sống khỏe',
    diem_thuong: 50,
    cap_do: 1,
    anh_dai_dien: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    anh_bia: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    tieu_su: 'Yêu thích lối sống lành mạnh và healthy',
  },
  {
    email: 'khach3@test.com',
    mat_khau: '123456',
    ho_ten: 'Lê Hoàng Long',
    so_dien_thoai: '0900000003',
    dia_chi: '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM',
    so_thich_am_thuc: 'Trà sữa, Đồ ăn vặt, Gà rán',
    muc_tieu_suc_khoe: 'enjoy',
    ngan_sach: 'LinhHoat',
    danh_hieu: 'Thực thần phố',
    diem_thuong: 200,
    cap_do: 2,
    anh_dai_dien: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    anh_bia: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    tieu_su: 'Tín đồ ẩm thực đường phố và cafe',
  },
];

const wsCustomers = XLSX.utils.json_to_sheet(customersData);
wsCustomers['!cols'] = calculateColumnWidths(customersData, {
  anh_dai_dien: 35,
  anh_bia: 35,
  dia_chi: 50,
  tieu_su: 40,
});

const wbCustomers = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbCustomers, wsCustomers, 'Khách Hàng');
const customersFile = path.join(dataDir, 'khach_hang.xlsx');
try {
  XLSX.writeFile(wbCustomers, customersFile);
  console.log('✓ Đã cập nhật:', customersFile);
} catch (err) {
  console.error('❌ Lỗi ghi file khach_hang.xlsx:', err.message);
}

// -------------------------------------------------------------
// 2. TẠO FILE nha_hang_va_mon_an.xlsx (ĐẦY ĐỦ 100% CÁC TRƯỜNG DB)
// -------------------------------------------------------------
const restaurantAndFoodsData = [
  {
    email_chu_quan: 'quan1@test.com',
    mat_khau_chu_quan: '123456',
    ten_chu_quan: 'Đỗ Quang Vinh',
    sdt_chu_quan: '0911000001',
    ten_quan: 'Bếp Cơm Phố Cổ',
    dia_chi_quan: '12 Hàng Buồm, Hoàn Kiếm, Hà Nội',
    link_dia_chi_quan: 'https://www.google.com/maps?q=21.0353,105.8525',
    quan_huyen: 'Hoàn Kiếm',
    thanh_pho: 'Hà Nội',
    vi_do_lat: 21.0353,
    kinh_do_lng: 105.8525,
    loai_am_thuc: 'Cơm, Món Bắc, Đồ truyền thống',
    danh_gia_sao: 4.8,
    so_luong_danh_gia: 45,
    mo_ta_quan: 'Quán cơm gia đình chuẩn vị Bắc, nguyên liệu tươi sạch mỗi ngày.',
    gio_mo_cua: '09:00 - 21:00',
    sdt_quan: '0243888999',
    link_logo_quan: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
    link_anh_bia_quan: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    nhom_thuc_don: 'Món chính',
    danh_muc: 'Cơm đĩa',
    ten_mon: 'Cơm Sườn Nướng Mật Ong',
    gia_tien: 55000,
    mo_ta_mon: 'Sườn heo nướng sốt mật ong thơm lừng, ăn kèm cơm dẻo, canh và rau xào.',
    link_anh_mon: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    the_tags: 'cơm, sườn nướng, ăn trưa, bán chạy',
    calo: 620,
    protein: 28,
    carbs: 70,
    fat: 18,
    luot_dat: 128,
    luot_thich: 46,
    mon_noi_bat: 'TRUE',
  },
  {
    email_chu_quan: '',
    mat_khau_chu_quan: '',
    ten_chu_quan: '',
    sdt_chu_quan: '',
    ten_quan: 'Bếp Cơm Phố Cổ',
    dia_chi_quan: '',
    link_dia_chi_quan: '',
    quan_huyen: '',
    thanh_pho: '',
    vi_do_lat: '',
    kinh_do_lng: '',
    loai_am_thuc: '',
    danh_gia_sao: '',
    so_luong_danh_gia: '',
    mo_ta_quan: '',
    gio_mo_cua: '',
    sdt_quan: '',
    link_logo_quan: '',
    link_anh_bia_quan: '',
    nhom_thuc_don: 'Món chính',
    danh_muc: 'Cơm đĩa',
    ten_mon: 'Cơm Gà Xối Mỡ Da Giòn',
    gia_tien: 50000,
    mo_ta_mon: 'Đùi gà góc tư chiên da giòn rụm bên ngoài mọng nước bên trong kèm cơm đỏ.',
    link_anh_mon: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500',
    the_tags: 'gà xối mỡ, cơm gà, giòn rụm',
    calo: 680,
    protein: 32,
    carbs: 75,
    fat: 22,
    luot_dat: 89,
    luot_thich: 31,
    mon_noi_bat: 'FALSE',
  },
  {
    email_chu_quan: '',
    mat_khau_chu_quan: '',
    ten_chu_quan: '',
    sdt_chu_quan: '',
    ten_quan: 'Bếp Cơm Phố Cổ',
    dia_chi_quan: '',
    link_dia_chi_quan: '',
    quan_huyen: '',
    thanh_pho: '',
    vi_do_lat: '',
    kinh_do_lng: '',
    loai_am_thuc: '',
    danh_gia_sao: '',
    so_luong_danh_gia: '',
    mo_ta_quan: '',
    gio_mo_cua: '',
    sdt_quan: '',
    link_logo_quan: '',
    link_anh_bia_quan: '',
    nhom_thuc_don: 'Đồ uống',
    danh_muc: 'Nước mát',
    ten_mon: 'Trà Đào Hạt Chia',
    gia_tien: 25000,
    mo_ta_mon: 'Trà đào thanh nhiệt giải khát, thạch đào giòn ngọt và hạt chia bổ dưỡng.',
    link_anh_mon: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
    the_tags: 'trà đào, giải khát, hạt chia',
    calo: 120,
    protein: 1,
    carbs: 28,
    fat: 0,
    luot_dat: 64,
    luot_thich: 18,
    mon_noi_bat: 'FALSE',
  },
  {
    email_chu_quan: 'quan2@test.com',
    mat_khau_chu_quan: '123456',
    ten_chu_quan: 'Phạm Thị Thanh',
    sdt_chu_quan: '0911000002',
    ten_quan: 'Phở Gia Truyền 1986',
    dia_chi_quan: '10 Lý Quốc Sư, Hoàn Kiếm, Hà Nội',
    link_dia_chi_quan: 'https://www.google.com/maps?q=21.0298,105.8492',
    quan_huyen: 'Hoàn Kiếm',
    thanh_pho: 'Hà Nội',
    vi_do_lat: 21.0298,
    kinh_do_lng: 105.8492,
    loai_am_thuc: 'Phở, Bún bò, Món nước',
    danh_gia_sao: 4.9,
    so_luong_danh_gia: 120,
    mo_ta_quan: 'Nước dùng ninh xương 12 tiếng thơm ngọt tự nhiên, thịt bò mềm tươi.',
    gio_mo_cua: '06:00 - 22:00',
    sdt_quan: '0243999888',
    link_logo_quan: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200',
    link_anh_bia_quan: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    nhom_thuc_don: 'Món chính',
    danh_muc: 'Phở Bò',
    ten_mon: 'Phở Bò Tái Nạm Đặc Biệt',
    gia_tien: 65000,
    mo_ta_mon: 'Bánh phở tươi mềm, nước dùng trong vắt ngọt thanh xương bò, thịt nạm mềm thơm và thịt tái tươi.',
    link_anh_mon: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500',
    the_tags: 'phở bò, tái nạm, món nước, truyền thống',
    calo: 510,
    protein: 30,
    carbs: 65,
    fat: 12,
    luot_dat: 320,
    luot_thich: 154,
    mon_noi_bat: 'TRUE',
  },
  {
    email_chu_quan: '',
    mat_khau_chu_quan: '',
    ten_chu_quan: '',
    sdt_chu_quan: '',
    ten_quan: 'Phở Gia Truyền 1986',
    dia_chi_quan: '',
    link_dia_chi_quan: '',
    quan_huyen: '',
    thanh_pho: '',
    vi_do_lat: '',
    kinh_do_lng: '',
    loai_am_thuc: '',
    danh_gia_sao: '',
    so_luong_danh_gia: '',
    mo_ta_quan: '',
    gio_mo_cua: '',
    sdt_quan: '',
    link_logo_quan: '',
    link_anh_bia_quan: '',
    nhom_thuc_don: 'Ăn kèm',
    danh_muc: 'Quẩy & Trứng',
    ten_mon: 'Quẩy Giòn & Trứng Chần',
    gia_tien: 15000,
    mo_ta_mon: 'Quẩy nóng giòn chấm nước dùng phở béo ngậy kèm một trứng gà ta chần lòng đào.',
    link_anh_mon: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
    the_tags: 'quẩy, trứng chần, ăn kèm',
    calo: 180,
    protein: 8,
    carbs: 15,
    fat: 9,
    luot_dat: 150,
    luot_thich: 52,
    mon_noi_bat: 'FALSE',
  },
  {
    email_chu_quan: 'quan3@test.com',
    mat_khau_chu_quan: '123456',
    ten_chu_quan: 'Nguyễn Minh Đức',
    sdt_chu_quan: '0911000003',
    ten_quan: 'Tiệm Trà & Cafe Mây',
    dia_chi_quan: '45 Đinh Tiên Hoàng, Đa Kao, Quận 1, TP.HCM',
    link_dia_chi_quan: 'https://www.google.com/maps?q=10.7876,106.6995',
    quan_huyen: 'Quận 1',
    thanh_pho: 'TP.HCM',
    vi_do_lat: 10.7876,
    kinh_do_lng: 106.6995,
    loai_am_thuc: 'Trà sữa, Cafe, Tráng miệng',
    danh_gia_sao: 4.7,
    so_luong_danh_gia: 88,
    mo_ta_quan: 'Không gian yên tĩnh, trà ô long đậm vị và cà phê rang xay thủ công.',
    gio_mo_cua: '07:30 - 22:30',
    sdt_quan: '0283777666',
    link_logo_quan: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200',
    link_anh_bia_quan: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800',
    nhom_thuc_don: 'Đồ uống',
    danh_muc: 'Trà Sữa',
    ten_mon: 'Trà Sữa Ô Long Nướng Trân Châu',
    gia_tien: 38000,
    mo_ta_mon: 'Trà ô long ủ đậm hương khói caramel kết hợp sữa thơm béo và trân châu đen dai giòn.',
    link_anh_mon: 'https://images.unsplash.com/photo-1558857563-b37fcda066b5?w=500',
    the_tags: 'trà sữa, ô long nướng, trân châu, ngọt dịu',
    calo: 350,
    protein: 4,
    carbs: 55,
    fat: 10,
    luot_dat: 210,
    luot_thich: 95,
    mon_noi_bat: 'TRUE',
  },
  {
    email_chu_quan: '',
    mat_khau_chu_quan: '',
    ten_chu_quan: '',
    sdt_chu_quan: '',
    ten_quan: 'Tiệm Trà & Cafe Mây',
    dia_chi_quan: '',
    link_dia_chi_quan: '',
    quan_huyen: '',
    thanh_pho: '',
    vi_do_lat: '',
    kinh_do_lng: '',
    loai_am_thuc: '',
    danh_gia_sao: '',
    so_luong_danh_gia: '',
    mo_ta_quan: '',
    gio_mo_cua: '',
    sdt_quan: '',
    link_logo_quan: '',
    link_anh_bia_quan: '',
    nhom_thuc_don: 'Đồ uống',
    danh_muc: 'Cà Phê',
    ten_mon: 'Cà Phê Muối Kem Béo',
    gia_tien: 32000,
    mo_ta_mon: 'Cà phê pha phin truyền thống thơm nồng kết hợp lớp kem mặn béo ngậy độc đáo.',
    link_anh_mon: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
    the_tags: 'cà phê muối, kem béo, thơm ngon',
    calo: 220,
    protein: 3,
    carbs: 25,
    fat: 12,
    luot_dat: 180,
    luot_thich: 76,
    mon_noi_bat: 'TRUE',
  },
];

const wsRestaurants = XLSX.utils.json_to_sheet(restaurantAndFoodsData);
wsRestaurants['!cols'] = calculateColumnWidths(restaurantAndFoodsData, {
  link_dia_chi_quan: 42,
  link_logo_quan: 32,
  link_anh_bia_quan: 32,
  link_anh_mon: 32,
  mo_ta_quan: 50,
  mo_ta_mon: 52,
  dia_chi_quan: 45,
});

const wbRestaurants = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbRestaurants, wsRestaurants, 'Nhà Hàng & Món Ăn');
const restaurantsFile = path.join(dataDir, 'nha_hang_va_mon_an.xlsx');
try {
  XLSX.writeFile(wbRestaurants, restaurantsFile);
  console.log('✓ Đã cập nhật:', restaurantsFile);
} catch (err) {
  console.error('❌ Lỗi ghi file nha_hang_va_mon_an.xlsx:', err.message);
}
