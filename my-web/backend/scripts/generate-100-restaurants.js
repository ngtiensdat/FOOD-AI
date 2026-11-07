// Script tạo bộ dữ liệu 100 NHÀ HÀNG & HƠN 1100 MÓN ĂN ĐA DẠNG
// - Phân khúc: Bình dân (40 quán), Trung cấp (40 quán), Cao cấp (20 quán)
// - Đa dạng thể loại: Phở, Bún bò, Bún chả, Bún đậu, Bún riêu, Cơm tấm, Cơm bình dân, Cơm niêu, Bánh mì, Bánh cuốn, Bánh xèo, Nem lụi, Mì Quảng, Hủ tiếu, Cháo, Xôi, Ốc, Gà rán, Pizza, Burger, Nướng BBQ, Lẩu, Mì cay, Sushi, Dimsum, Cà phê, Trà sữa, Chè, Đồ chay, Bò tơ/Dê núi, Fine Dining...
// - Địa chỉ thật Google Maps tại Hà Nội & TP.HCM, tọa độ thật, link Google Maps thật.
// - Tên quán biến tấu khéo léo để không dính bản quyền thương hiệu.
// - Trường link_anh_mon để trống "" để người dùng tự xem tên món và điền link sau.
// - Mỗi quán có email riêng duy nhất làm key chống trùng lặp khi import.

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const dataDir = path.resolve(__dirname, '../../../data-import');

// =========================================================================
// HÀM HELPER TẠO MENU 10 - 12 MÓN CHUẨN ĐẸP CHO MỖI QUÁN
// =========================================================================
function makeDishes(baseItems, signatureItem, drinkItems, sideItems, dessertItems) {
  const dishes = [];
  // 1. Món signature nổi bật
  if (signatureItem) {
    dishes.push({
      group: 'Món chính',
      cat: signatureItem.cat,
      name: signatureItem.name,
      price: signatureItem.price,
      desc: signatureItem.desc,
      tags: signatureItem.tags,
      calo: signatureItem.calo,
      p: signatureItem.p,
      c: signatureItem.c,
      f: signatureItem.f,
      order: signatureItem.order || 350,
      like: signatureItem.like || 180,
      hot: 'TRUE',
    });
  }

  // 2. Các món chính biến thể (5 - 6 món)
  for (const item of baseItems) {
    dishes.push({
      group: 'Món chính',
      cat: item.cat,
      name: item.name,
      price: item.price,
      desc: item.desc,
      tags: item.tags,
      calo: item.calo,
      p: item.p,
      c: item.c,
      f: item.f,
      order: item.order || Math.floor(Math.random() * 200 + 100),
      like: item.like || Math.floor(Math.random() * 90 + 40),
      hot: item.hot || 'FALSE',
    });
  }

  // 3. Món ăn kèm (2 - 3 món)
  if (sideItems) {
    for (const item of sideItems) {
      dishes.push({
        group: 'Ăn kèm',
        cat: item.cat || 'Món phụ',
        name: item.name,
        price: item.price,
        desc: item.desc,
        tags: item.tags,
        calo: item.calo,
        p: item.p,
        c: item.c,
        f: item.f,
        order: item.order || Math.floor(Math.random() * 150 + 80),
        like: item.like || Math.floor(Math.random() * 60 + 20),
        hot: 'FALSE',
      });
    }
  }

  // 4. Đồ uống (2 - 3 món)
  if (drinkItems) {
    for (const item of drinkItems) {
      dishes.push({
        group: 'Đồ uống',
        cat: item.cat || 'Giải khát',
        name: item.name,
        price: item.price,
        desc: item.desc,
        tags: item.tags,
        calo: item.calo,
        p: item.p,
        c: item.c,
        f: item.f,
        order: item.order || Math.floor(Math.random() * 250 + 120),
        like: item.like || Math.floor(Math.random() * 80 + 30),
        hot: 'FALSE',
      });
    }
  }

  // 5. Tráng miệng (1 - 2 món)
  if (dessertItems) {
    for (const item of dessertItems) {
      dishes.push({
        group: 'Tráng miệng',
        cat: item.cat || 'Món ngọt',
        name: item.name,
        price: item.price,
        desc: item.desc,
        tags: item.tags,
        calo: item.calo,
        p: item.p,
        c: item.c,
        f: item.f,
        order: item.order || Math.floor(Math.random() * 180 + 60),
        like: item.like || Math.floor(Math.random() * 70 + 25),
        hot: 'FALSE',
      });
    }
  }

  return dishes;
}

// =========================================================================
// DANH SÁCH 100 NHÀ HÀNG & MÓN ĂN CHI TIẾT
// =========================================================================
const allRestaurants = [];

// Helper thêm quán vào danh sách
function addRest(id, name, owner, phone, email, address, mapUrl, district, city, lat, lng, cuisines, rating, reviews, desc, hours, dishes) {
  allRestaurants.push({
    info: {
      email,
      pass: '123456',
      owner,
      ownerPhone: phone,
      name,
      address,
      mapUrl,
      district,
      city,
      lat,
      lng,
      cuisines,
      rating,
      reviews,
      desc,
      hours,
      phone,
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
      cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    },
    foods: dishes,
  });
}

// -------------------------------------------------------------
// NHÓM 1: PHỞ BÒ / PHỞ GÀ (4 QUÁN)
// -------------------------------------------------------------
addRest(1, 'Phở Thình Lò Đúc Gia Truyền', 'Nguyễn Văn Thình', '0901000001', 'quan01_phothinh@foodai.vn', '13 Lò Đúc, Phạm Đình Hổ, Hai Bà Trưng, Hà Nội', 'https://www.google.com/maps?q=21.0182,105.8565', 'Hai Bà Trưng', 'Hà Nội', 21.0182, 105.8565, 'Phở bò, Món nước, Ăn sáng', 4.8, 380, 'Phở bò tái lăn áp chảo thơm lừng mùi tỏi và hành lá ngập bát chuẩn phong vị Hà Thành xưa.', '06:00 - 21:00',
  makeDishes([
    { cat: 'Phở Bò', name: 'Phở Bò Tái Nạm Gầu Giòn', price: 60000, desc: 'Bò tái mềm kết hợp nạm gầu giòn sần sật ninh nước xương trong vắt.', tags: 'phở bò, tái nạm, gầu giòn', calo: 540, p: 30, c: 65, f: 14 },
    { cat: 'Phở Bò', name: 'Phở Bò Chín Nạm Thơm Mềm', price: 55000, desc: 'Thịt nạm chín thái mỏng mềm ngọt, nước dùng thanh tao.', tags: 'phở chín, nạm bò, truyền thống', calo: 510, p: 28, c: 64, f: 12 },
    { cat: 'Phở Bò', name: 'Phở Bò Sốt Vang Đậm Đà', price: 65000, desc: 'Bò dẻ sườn hầm sốt vang quế hồi gấc đỏ sánh mịn béo ngậy.', tags: 'sốt vang, dẻ sườn, béo ngậy', calo: 620, p: 34, c: 68, f: 18 },
    { cat: 'Phở Bò', name: 'Phở Bò Tái Trứng Gà Ta', price: 60000, desc: 'Thịt bò tái chần mềm ngọt kết hợp lòng đỏ trứng gà ta béo bùi.', tags: 'bò tái, trứng gà, bổ dưỡng', calo: 560, p: 32, c: 62, f: 15 },
    { cat: 'Phở Bò', name: 'Phở Bò Gân Trong Giòn Sần Sật', price: 55000, desc: 'Gân bò trong veo ninh đủ độ giòn dai sần sật ăn không ngấy.', tags: 'gân bò, giòn dai, thanh ngọt', calo: 490, p: 26, c: 60, f: 10 },
  ],
  { cat: 'Phở Bò', name: 'Phở Bò Tái Lăn Lò Đúc Đặc Biệt', price: 70000, desc: 'Bò tái lăn lửa lớn tỏi thơm nức mũi, hành lá tươi phủ kín bát nước dùng đậm vị béo ngậy.', tags: 'tái lăn, lò đúc, signature, best-seller', calo: 650, p: 38, c: 70, f: 20 },
  [
    { cat: 'Giải khát', name: 'Trà Đá Hoa Cúc Vỉa Hè', price: 5000, desc: 'Trà mạn ướp hoa cúc thanh mát giải nhiệt.', tags: 'trà đá, hoa cúc, giải nhiệt', calo: 5, p: 0, c: 1, f: 0 },
    { cat: 'Nước chua', name: 'Nước Chanh Tươi Mật Ong Đá', price: 15000, desc: 'Nước cốt chanh tươi pha mật ong rừng chua ngọt sảng khoái.', tags: 'chanh tươi, mật ong, vitamin C', calo: 80, p: 0, c: 20, f: 0 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Quẩy Giòn Phố Cổ (5 chiếc)', price: 10000, desc: 'Quẩy chiên vàng ruộm ráo dầu giòn xốp.', tags: 'quẩy, giòn tan', calo: 160, p: 4, c: 25, f: 5 },
    { cat: 'Ăn kèm', name: 'Tiết Luộc Chần Nước Dùng Phở', price: 12000, desc: 'Tiết heo luộc mềm mướt như thạch chan nước dùng thơm ngọt.', tags: 'tiết luộc, mềm mướt', calo: 90, p: 12, c: 2, f: 3 },
  ]
));

addRest(2, 'Phở Bát Đàng Cổ Truyền', 'Phạm Bát Đàng', '0901000002', 'quan02_phobatdang@foodai.vn', '49 Bát Đàn, Cửa Đông, Hoàn Kiếm, Hà Nội', 'https://www.google.com/maps?q=21.0336,105.8465', 'Hoàn Kiếm', 'Hà Nội', 21.0336, 105.8465, 'Phở bò cổ truyền, Tái nạm, Nước trong', 4.9, 520, 'Quán phở xếp hàng nức tiếng phố cổ, nước dùng không bột ngọt ngọt sâu vị tuỷ bò tự nhiên.', '06:00 - 20:30',
  makeDishes([
    { cat: 'Phở Cổ Truyền', name: 'Phở Bò Tái Nạm Nước Trong', price: 60000, desc: 'Thịt bò tươi thái mỏng chần tái mềm, nạm giòn nước dùng trong vắt thanh tao.', tags: 'phở tái nạm, nước trong, truyền thống', calo: 520, p: 32, c: 65, f: 12 },
    { cat: 'Phở Cổ Truyền', name: 'Phở Bò Tái Gầu Giòn Vàng', price: 65000, desc: 'Gầu bò giòn thơm không ngấy, bánh phở thái tay mềm mướt.', tags: 'gầu giòn, thái tay, phở xưa', calo: 560, p: 30, c: 64, f: 16 },
    { cat: 'Phở Cổ Truyền', name: 'Phở Bò Bắp Hoa Hảo Hạng', price: 75000, desc: 'Lõi bắp hoa bò giòn sần sật thái lát hoa văn tuyệt đẹp.', tags: 'bắp hoa, lõi rùa, hảo hạng', calo: 540, p: 36, c: 62, f: 11 },
    { cat: 'Phở Cổ Truyền', name: 'Phở Chín Nạm Gầu Béo', price: 60000, desc: 'Thịt chín ninh mềm ngấm vị gừng nướng và thảo quả thơm dịu.', tags: 'thịt chín, thảo quả, gừng nướng', calo: 530, p: 29, c: 64, f: 13 },
  ],
  { cat: 'Phở Cổ Truyền', name: 'Phở Bò Đặc Biệt Thập Cẩm Bát Đàn', price: 80000, desc: 'Hội tụ đầy đủ tái, nạm, gầu, bắp hoa, nước hầm xương tủy bò 24 giờ thơm lừng hương hồi quế.', tags: 'thập cẩm, bát đàn, đặc biệt, tinh hoa', calo: 680, p: 44, c: 68, f: 18 },
  [
    { cat: 'Trà thảo mộc', name: 'Trà Mạn Tân Cương Ướp Nhài', price: 8000, desc: 'Trà mạn đậm chát ngọt hậu thoang thoảng hương hoa nhài.', tags: 'trà mạn, hoa nhài, thanh tao', calo: 2, p: 0, c: 0, f: 0 },
    { cat: 'Sữa đậu', name: 'Sữa Đậu Nành Tươi Nóng', price: 12000, desc: 'Sữa đậu nành nguyên chất nấu thủ công.', tags: 'sữa đậu nành, ấm nóng', calo: 100, p: 6, c: 12, f: 2 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Quẩy Giòn Bát Đàn', price: 10000, desc: 'Đĩa quẩy nóng giòn rụm chấm nước phở.', tags: 'quẩy giòn', calo: 160, p: 4, c: 25, f: 5 },
    { cat: 'Ăn kèm', name: 'Trứng Gà Ta Trần Lòng Đào', price: 10000, desc: 'Trứng gà ta trần nước phở nóng béo ngậy.', tags: 'trứng trần, lòng đào', calo: 80, p: 6, c: 1, f: 6 },
  ]
));

addRest(3, 'Phở Gà Châm Yên Ninh Thượng Phẩm', 'Nguyễn Thị Bích Châm', '0901000003', 'quan03_phogacham@foodai.vn', '64 Yên Ninh, Quán Thánh, Ba Đình, Hà Nội', 'https://www.google.com/maps?q=21.0422,105.8431', 'Ba Đình', 'Hà Nội', 21.0422, 105.8431, 'Phở gà ta, Gà đồi, Miến gà, Lòng mề', 4.7, 310, 'Quán phở gà ta da vàng óng giòn sần sật, thịt ngọt chắc thịt ninh từ gà mái ghẹ tươi sống.', '06:30 - 21:00',
  makeDishes([
    { cat: 'Phở Gà', name: 'Phở Gà Thịt Trắng Nạc Thơm', price: 50000, desc: 'Thịt ức gà ta xé mỏng ngọt thanh, nước dùng lá chanh thơm mát.', tags: 'phở gà, thịt trắng, ít béo, eat-clean', calo: 430, p: 35, c: 62, f: 6 },
    { cat: 'Phở Gà', name: 'Phở Gà Đùi Da Giòn Vàng Ruộm', price: 65000, desc: 'Thịt đùi gà ta chặt miếng da giòn rụm béo ngậy thơm nức mùi lá chanh.', tags: 'đùi gà, da giòn, béo ngậy', calo: 550, p: 36, c: 64, f: 16 },
    { cat: 'Phở Gà', name: 'Phở Gà Lòng Mề Trứng Non', price: 70000, desc: 'Lòng mề gà xào giòn sần sật kết hợp chùm trứng non vàng ươm bùi béo.', tags: 'trứng non, lòng mề, bùi béo', calo: 580, p: 38, c: 60, f: 18 },
    { cat: 'Miến Gà', name: 'Miến Gà Ta Nấm Hương Thơm Nồng', price: 55000, desc: 'Sợi miến dong dai giòn nấu cùng gà ta và nấm hương rừng Tây Bắc.', tags: 'miến gà, nấm hương, thanh đạm', calo: 460, p: 30, c: 66, f: 8 },
  ],
  { cat: 'Phở Gà', name: 'Phở Gà Đùi Chặt Cánh Rút Xương Đặc Biệt', price: 85000, desc: 'Phần đùi má và cánh gà ngon nhất chặt miếng dày, da vàng bóng chấm muối ớt chanh ớt gió.', tags: 'đùi cánh gà, đặc biệt, muối tiêu chanh', calo: 620, p: 44, c: 65, f: 20 },
  [
    { cat: 'Giải khát', name: 'Nước Sấu Ngâm Gừng Giòn Chua Ngọt', price: 15000, desc: 'Nước sấu phố cổ ngâm đường gừng giải nhiệt.', tags: 'nước sấu, giải nhiệt', calo: 90, p: 0, c: 22, f: 0 },
    { cat: 'Trà', name: 'Trà Đá Hương Nhài', price: 5000, desc: 'Trà đá hương hoa nhài thơm mát.', tags: 'trà đá', calo: 2, p: 0, c: 0, f: 0 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Đĩa Trứng Non Chần Nước Gà (5 quả)', price: 30000, desc: 'Trứng non gà ta béo ngậy chấm bột canh chanh ớt.', tags: 'trứng non, béo ngậy', calo: 180, p: 14, c: 2, f: 12 },
    { cat: 'Ăn kèm', name: 'Quẩy Bở Nước Gà (5 cái)', price: 10000, desc: 'Quẩy mềm xốp ngấm đẫm nước dùng gà ngọt béo.', tags: 'quẩy', calo: 150, p: 4, c: 24, f: 4 },
  ]
));

addRest(4, 'Phở Lệ Gia Truyền Sài Gòn', 'Lê Văn Lệ', '0901000004', 'quan04_phole@foodai.vn', '415 Nguyễn Trãi, Phường 7, Quận 5, TP.HCM', 'https://www.google.com/maps?q=10.7538,106.6669', 'Quận 5', 'TP.HCM', 10.7538, 106.6669, 'Phở Sài Gòn, Bò viên khổng lồ, Nước béo', 4.8, 640, 'Thương hiệu phở bò trứ danh người Hoa Chợ Lớn với bò viên tự làm giòn sần sật và tương đen đặc chế.', '06:00 - 01:00',
  makeDishes([
    { cat: 'Phở Sài Gòn', name: 'Phở Tái Bò Viên Khổng Lồ', price: 75000, desc: 'Bò tái mềm mọng nước ăn cùng viên bò viên to bằng nắm tay giòn dai thơm tiêu sọ chấm tương đen ngọt.', tags: 'bò viên, tái mềm, phở sài gòn', calo: 620, p: 38, c: 72, f: 18 },
    { cat: 'Phở Sài Gòn', name: 'Phở Nạm Gầu Béo Ngậy Đậm Đà', price: 70000, desc: 'Nạm bò mềm thơm béo ngậy rắc hành tây thái mỏng và rau húng quế ngò gai thơm ngát.', tags: 'nạm gầu, rau húng quế, ngò gai', calo: 590, p: 34, c: 70, f: 17 },
    { cat: 'Phở Sài Gòn', name: 'Phở Tái Gân Móng Nước Dùng Béo', price: 75000, desc: 'Gân bò ninh dẻo mềm dính da trong nước súp ngọt đậm vị xương ống.', tags: 'tái gân, nước béo, đậm đà', calo: 640, p: 36, c: 70, f: 20 },
  ],
  { cat: 'Phở Sài Gòn', name: 'Tô Phở Thập Cẩm Xe Lửa Đại Bổ', price: 90000, desc: 'Tô xe lửa khổng lồ với tái, nạm, gầu, gân, bò viên, chén tiết hột gà nước béo hành trần ngập tràn.', tags: 'xe lửa, đại bổ, thập cẩm, no căng', calo: 780, p: 52, c: 78, f: 26 },
  [
    { cat: 'Nước mát', name: 'Rau Má Đậu Xanh Đường Phèn', price: 20000, desc: 'Rau má tươi xay nhuyễn mịn cùng đậu xanh bùi béo mát gan.', tags: 'rau má, đậu xanh, mát gan', calo: 130, p: 4, c: 26, f: 1 },
    { cat: 'Giải khát', name: 'Trà Tắc Xí Muội Mặn Ngọt', price: 18000, desc: 'Trà lài pha quả tắc chua thanh và xí muội mặn ngọt.', tags: 'trà tắc, xí muội', calo: 95, p: 0, c: 24, f: 0 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Chén Bò Viên Thêm (3 viên)', price: 35000, desc: 'Bò viên tự làm giòn dai sần sật trong chén nước béo thơm.', tags: 'bò viên thêm', calo: 240, p: 20, c: 4, f: 14 },
    { cat: 'Ăn kèm', name: 'Chén Hột Gà Nước Béo', price: 15000, desc: 'Lòng đỏ trứng gà ta béo ngậy trần trong chén mỡ hành hoa.', tags: 'hột gà, nước béo', calo: 140, p: 7, c: 2, f: 12 },
  ]
));

// -------------------------------------------------------------
// NHÓM 2: BÁNH XÈO & NEM LỤI (3 QUÁN - THEO ĐÚNG YÊU CẦU NEM LỤI)
// -------------------------------------------------------------
addRest(5, 'Nem Lụi & Bánh Xèo Bà Dưỡng Mới', 'Hoàng Thị Dưỡng', '0901000005', 'quan05_nemluibaduong@foodai.vn', '89 Đội Cấn, Liễu Giai, Ba Đình, Hà Nội', 'https://www.google.com/maps?q=21.0368,105.8239', 'Ba Đình', 'Hà Nội', 21.0368, 105.8239, 'Nem lụi Huế, Bánh xèo miền Trung, Nước lèo gan đậu', 4.8, 370, 'Quán nem lụi nướng than hoa thơm lừng sả cây và bánh xèo vỏ giòn tan chấm sốt nước lèo gan đậu bí truyền.', '09:00 - 22:00',
  makeDishes([
    { cat: 'Nem Lụi', name: 'Mẹt Nem Lụi Nướng Cây Sả (10 que)', price: 80000, desc: 'Thịt heo tươi giã nhuyễn quết gia vị quấn sả cây nướng than hoa đượm khói, cuốn bánh tráng rau sống dưa leo khế chua chuối chát.', tags: 'nem lụi, nướng sả, rau sống, nước lèo', calo: 540, p: 38, c: 35, f: 24 },
    { cat: 'Nem Lụi', name: 'Nem Lụi Nướng Phô Mai Tan Chảy (6 que)', price: 65000, desc: 'Nem lụi giòn béo bọc nhân phô mai mozzarella kéo sợi thơm ngậy độc đáo.', tags: 'nem lụi phô mai, kéo sợi, thơm ngậy', calo: 480, p: 28, c: 20, f: 28 },
    { cat: 'Bánh Xèo', name: 'Bánh Xèo Tôm Nhảy Vỏ Giòn Rụm', price: 40000, desc: 'Bột gạo pha nước cốt dừa và nghệ vàng ruộm đúc giòn tan, nhân tôm đất tươi ngọt, thịt ba chỉ và giá đỗ.', tags: 'bánh xèo, tôm nhảy, giòn rụm', calo: 450, p: 20, c: 50, f: 18 },
    { cat: 'Bánh Xèo', name: 'Bánh Xèo Bò Úc Nấm Kim Châm', price: 50000, desc: 'Bánh xèo nhân thịt bò Úc mềm ngọt và nấm kim châm giòn ngọt thanh tao.', tags: 'bánh xèo bò, nấm kim châm', calo: 480, p: 25, c: 50, f: 19 },
  ],
  { cat: 'Đặc biệt', name: 'Mẹt Bánh Xèo Nem Lụi Khổng Lồ Cho 2 Người', price: 145000, desc: 'Mẹt siêu to gồm 2 bánh xèo tôm thịt giòn rụm, 8 que nem lụi nướng sả, đĩa rau rừng tươi mơn mởn và 2 tô nước lèo gan heo đậu phộng béo ngậy.', tags: 'combo 2 người, mẹt khổng lồ, nem lụi, bánh xèo', calo: 920, p: 55, c: 85, f: 38 },
  [
    { cat: 'Giải khát', name: 'Nước Mía Tươi Cốt Tắc Ép Lạnh', price: 12000, desc: 'Nước mía sạch ngọt mát ép cùng trái tắc thơm nồng.', tags: 'nước mía, cốt tắc, mát lạnh', calo: 110, p: 0, c: 28, f: 0 },
    { cat: 'Trà', name: 'Trà Sâm Hạt Chia Mát Gan', price: 15000, desc: 'Nước sâm lá dứa hạt chia giải nhiệt khi ăn đồ nướng rán.', tags: 'sâm hạt chia, mát gan', calo: 70, p: 1, c: 16, f: 0 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Đĩa Rau Sống Rừng & Bánh Tráng Cuốn Thêm', price: 15000, desc: 'Rau xà lách, tía tô, kinh giới, lá cóc, lá xoài non và bánh tráng phơi sương mềm dẻo.', tags: 'rau sống, bánh tráng', calo: 60, p: 2, c: 12, f: 0 },
    { cat: 'Ăn kèm', name: 'Chén Nước Lèo Gan Heo Đậu Phộng Thêm', price: 10000, desc: 'Nước lèo nấu từ gan heo, thịt xay, mè và tương đậu béo bùi kẹo sệt.', tags: 'nước lèo gan, béo bùi', calo: 130, p: 6, c: 8, f: 9 },
  ]
));

addRest(6, 'Bánh Xèo Tôm Nhảy Cô Ba Miền Tây', 'Võ Thị Ba', '0901000006', 'quan06_banhxeocoba@foodai.vn', '10 Hoàng Diệu, Phường 10, Phú Nhuận, TP.HCM', 'https://www.google.com/maps?q=10.7968,106.6781', 'Phú Nhuận', 'TP.HCM', 10.7968, 106.6781, 'Bánh xèo miền Tây, Bánh khọt tôm nhảy, Nem nướng', 4.8, 410, 'Bánh xèo chảo lớn chuẩn vị miền Tây vàng giòn vành rộng, nhân củ hủ dừa tôm sông tươi ngọt cuốn hơn 20 loại rau rừng.', '10:00 - 22:00',
  makeDishes([
    { cat: 'Bánh Xèo', name: 'Bánh Xèo Củ Hủ Dừa Tôm Sông Thịt Ba Chỉ', price: 65000, desc: 'Vành bánh mỏng tang giòn xốp rụm, nhân củ hủ dừa non ngọt lịm xào tôm sông và thịt ba rọi.', tags: 'củ hủ dừa, tôm sông, miền tây, giòn rụm', calo: 520, p: 24, c: 58, f: 20 },
    { cat: 'Bánh Khọt', name: 'Bánh Khọt Tôm Nhảy Nước Cốt Dừa (8 cái)', price: 55000, desc: 'Chiếc bánh khọt tròn xoe giòn đáy mềm mặt, con tôm đỏ au chan nước cốt dừa béo ngậy rắc bột tôm khô thơm nức.', tags: 'bánh khọt, tôm nhảy, cốt dừa, béo ngậy', calo: 480, p: 22, c: 45, f: 22 },
    { cat: 'Nem Nướng', name: 'Nem Nướng Miền Tây Cuốn Bánh Hỏi (6 cây)', price: 70000, desc: 'Thịt heo quết dẻo nướng xém vàng ăn kèm bánh hỏi lá dứa thoa mỡ hành thơm phức.', tags: 'nem nướng, bánh hỏi, mỡ hành', calo: 510, p: 32, c: 48, f: 18 },
  ],
  { cat: 'Đặc sắc', name: 'Bánh Xèo Nấm Mối Thịt Vịt Xiêm Thượng Hạng', price: 95000, desc: 'Thịt vịt xiêm bằm xào nấm mối thiên nhiên thơm ngào ngạt bọc trong lớp vỏ bánh xèo giòn rụm.', tags: 'nấm mối, vịt xiêm, thượng hạng, độc đáo', calo: 620, p: 35, c: 56, f: 26 },
  [
    { cat: 'Nước mát', name: 'Nước Dừa Xiêm Tươi Bến Tre', price: 25000, desc: 'Dừa xiêm ngọt lịm thanh mát cả quả.', tags: 'dừa xiêm, thanh ngọt', calo: 60, p: 1, c: 14, f: 0 },
    { cat: 'Trà', name: 'Trà Vải Hoa Hồng Hạt Đác', price: 28000, desc: 'Trà lài kết hợp vải tươi và hạt đác rim dẻo.', tags: 'trà vải, hạt đác', calo: 120, p: 1, c: 28, f: 0 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Đĩa Bánh Hỏi Thoa Mỡ Hành Thêm', price: 20000, desc: 'Bánh hỏi gạo nàng thơm thoa mỡ hành tóp mỡ giòn.', tags: 'bánh hỏi, tóp mỡ', calo: 210, p: 4, c: 38, f: 5 },
  ]
));

addRest(7, 'Nem Lụi Nướng Đội Cấn Xứ Huế', 'Phan Văn Lụi', '0901000007', 'quan07_nemluidoican@foodai.vn', '166 Đội Cấn, Ba Đình, Hà Nội', 'https://www.google.com/maps?q=21.0354,105.8198', 'Ba Đình', 'Hà Nội', 21.0354, 105.8198, 'Nem lụi, Bánh bột lọc, Bánh ram ít, Ẩm thực cố đô', 4.7, 280, 'Thủ phủ nem lụi nướng than hoa Đội Cấn nổi tiếng học sinh sinh viên Hà Nội, nem nướng đượm vị thơm ngát mỡ sả.', '10:00 - 21:30',
  makeDishes([
    { cat: 'Nem Lụi', name: 'Suất Nem Lụi Nướng 8 Cây Kèm Rau Bánh Tráng', price: 65000, desc: 'Nem lụi nướng vàng xém cạnh béo thơm cuốn chuối chát khế chua chấm sốt tương nếp gan heo thơm bùi.', tags: 'nem lụi, đội cấn, tương nếp, thơm nức', calo: 490, p: 34, c: 32, f: 22 },
    { cat: 'Món Huế', name: 'Bánh Bột Lọc Tôm Thịt Lá Chuối (10 cái)', price: 45000, desc: 'Bánh lọc trong vắt dai dai nhìn rõ nhân tôm đỏ và thịt mỡ bọc mộc nhĩ chấm mắm ớt cay xè.', tags: 'bánh bột lọc, tôm thịt, dai giòn', calo: 310, p: 14, c: 48, f: 6 },
    { cat: 'Món Huế', name: 'Bánh Ram Ít Tôm Thịt Giòn Dẻo', price: 40000, desc: 'Phần ram chiên giòn rụm bên dưới nâng đỡ viên bánh ít dẻo mềm nhân tôm bên trên rắc tôm chấy.', tags: 'bánh ram ít, tôm chấy, giòn dẻo', calo: 340, p: 12, c: 46, f: 10 },
  ],
  { cat: 'Combo', name: 'Combo Cố Đô: Nem Lụi + Bánh Bột Lọc + Bánh Xèo', price: 110000, desc: 'Mâm tiệc Huế gồm 5 cây nem lụi, 5 cái bánh lọc, 1 bánh xèo tôm nhảy và đĩa rau xanh ngút ngàn.', tags: 'combo cố đô, thập cẩm, huế', calo: 750, p: 44, c: 72, f: 28 },
  [
    { cat: 'Giải khát', name: 'Sữa Chua Đánh Đá Cà Phê', price: 20000, desc: 'Sữa chua dẻo nhà làm đánh đá nhuyễn rưới cà phê thơm nồng.', tags: 'sữa chua đánh đá, cà phê', calo: 160, p: 5, c: 26, f: 4 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Chén Tương Nếp Chấm Nem Lụi Thêm', price: 8000, desc: 'Nước chấm tương nếp đậu phộng rang giã mịn béo ngọt.', tags: 'nước chấm nem', calo: 90, p: 3, c: 8, f: 5 },
  ]
));

// -------------------------------------------------------------
// NHÓM 3: BÚN CHẢ & BÚN ĐẬU & BÚN BÒ & BÚN RIÊU (8 QUÁN)
// -------------------------------------------------------------
addRest(8, 'Bún Chả Hương Liêm Lê Văn Hưu', 'Lê Hương Liêm', '0901000008', 'quan08_bunchahuonglien@foodai.vn', '24 Lê Văn Hưu, Phan Chu Trinh, Hai Bà Trưng, Hà Nội', 'https://www.google.com/maps?q=21.0189,105.8523', 'Hai Bà Trưng', 'Hà Nội', 21.0189, 105.8523, 'Bún chả nướng than hoa, Nem cua bể, Chả que tre', 4.8, 590, 'Quán bún chả truyền thống nổi tiếng từng đón tiếp Tổng thống Mỹ, chả nướng than hoa thơm lừng và nem hải sản giòn rụm.', '08:00 - 20:30',
  makeDishes([
    { cat: 'Bún Chả', name: 'Bún Chả Ba Chỉ Nướng Than Que Tre', price: 55000, desc: 'Thịt ba rọi ướp gia vị kẹp que tre nướng vàng xém thơm lừng mùi khói than hoa.', tags: 'bún chả, ba chỉ nướng, than que tre', calo: 580, p: 32, c: 68, f: 20 },
    { cat: 'Bún Chả', name: 'Bún Chả Băm Nướng Lá Xương Sông', price: 55000, desc: 'Chả thịt nạc vai băm nhuyễn bọc lá xương sông nướng thơm lừng vị thuốc Nam ấm bụng.', tags: 'chả băm, xương sông, thơm nức', calo: 540, p: 30, c: 65, f: 18 },
    { cat: 'Nem Rán', name: 'Nem Cua Bể Hải Phòng Giòn Rụm (2 chiếc)', price: 40000, desc: 'Vỏ bánh tráng giòn rụm nhân đầy ắp thịt cua bể tươi, tôm và miến mộc nhĩ nấm hương.', tags: 'nem cua bể, giòn rụm, hải sản', calo: 380, p: 22, c: 26, f: 20 },
  ],
  { cat: 'Bún Chả', name: 'Bún Chả Đặc Biệt Suất Tổng Thống Obama', price: 75000, desc: 'Đầy đủ chả miếng, chả băm, nem cua bể khổng lồ, bún tươi và tô nước mắm đu đủ cà rốt ấm nóng thơm nồng tỏi ớt.', tags: 'suất tổng thống, obama, đặc biệt, best-seller', calo: 780, p: 46, c: 75, f: 28 },
  [
    { cat: 'Bia & Nước', name: 'Bia Trúc Bạch Hà Nội Ướp Lạnh', price: 25000, desc: 'Bia lon Trúc Bạch hảo hạng thơm hoa bia uống cùng bún chả cực kỳ hợp vị.', tags: 'bia trúc bạch, ướp lạnh', calo: 140, p: 1, c: 10, f: 0 },
    { cat: 'Trà', name: 'Trà Đá Hoa Nhài', price: 5000, desc: 'Trà mạn đá lạnh.', tags: 'trà đá', calo: 2, p: 0, c: 0, f: 0 },
  ],
  [
    { cat: 'Ăn kèm', name: 'Đĩa Bún Tươi Thêm', price: 10000, desc: 'Bún lá mỏng tươi mới.', tags: 'bún thêm', calo: 180, p: 4, c: 40, f: 0 },
  ]
));

addRest(9, 'Bún Chả Đắc Kim Hàng Mành', 'Đỗ Đắc Kim', '0901000009', 'quan09_bunchadackim@foodai.vn', '1 Hàng Mành, Hàng Gai, Hoàn Kiếm, Hà Nội', 'https://www.google.com/maps?q=21.0322,105.8481', 'Hoàn Kiếm', 'Hà Nội', 21.0322, 105.8481, 'Bún chả phố cổ, Nem ốc, Nem tôm thịt', 4.7, 480, 'Thương hiệu bún chả Hàng Mành nổi danh với tô chả ngập tràn thịt và nem ốc giòn sần sật.', '08:30 - 21:00',
  makeDishes([
    { cat: 'Bún Chả', name: 'Bún Chả Suất Truyền Thống Đầy Đặn', price: 65000, desc: 'Bát chả đầy ngập thịt nướng xém cạnh, nước mắm pha chua ngọt thơm ngào ngạt.', tags: 'bún chả, hàng mành, đầy đặn', calo: 650, p: 38, c: 70, f: 22 },
    { cat: 'Nem Rán', name: 'Nem Ốc Phố Cổ Chiên Giòn Rụm', price: 35000, desc: 'Ốc băm nhỏ giòn sần sật cuộn cùng lá lốt và giò sống chiên ráo dầu.', tags: 'nem ốc, giòn sần sật, lá lốt', calo: 280, p: 16, c: 18, f: 16 },
  ],
  { cat: 'Bún Chả', name: 'Suất Bún Chả Đặc Biệt + 2 Nem Cua Bể Khổng Lồ', price: 90000, desc: 'Suất ăn hoàng tráng dành cho thực khách sành ăn với 2 loại chả nướng và nem cua bể đầy ắp thịt cua.', tags: 'đặc biệt, nem cua bể, no căng', calo: 860, p: 52, c: 75, f: 34 },
  [
    { cat: 'Giải khát', name: 'Nước Mơ Chùa Hương Chua Ngọt', price: 15000, desc: 'Mơ ngâm đường phèn thanh nhiệt.', tags: 'nước mơ', calo: 90, p: 0, c: 22, f: 0 },
  ]
));

addRest(10, 'Bún Đậu Mẹt Cốm Hàng Khay', 'Nguyễn Thị Cốm', '0901000010', 'quan10_bundaumethangkhay@foodai.vn', '31 Ngõ 29 Hàng Khay, Tràng Tiền, Hoàn Kiếm, Hà Nội', 'https://www.google.com/maps?q=21.0278,105.8524', 'Hoàn Kiếm', 'Hà Nội', 21.0278, 105.8524, 'Bún đậu mắm tôm, Chả cốm Làng Vòng, Dồi sụn, Thịt luộc', 4.8, 510, 'Quán bún đậu ngõ nhỏ đông đúc bậc nhất thủ đô với mắm tôm Thanh Hóa đánh bông bọt quất ớt thơm nức mũi.', '09:00 - 21:00',
  makeDishes([
    { cat: 'Bún Đậu', name: 'Mẹt Bún Đậu Đầy Đủ Thập Cẩm', price: 65000, desc: 'Đậu Mơ lướt ván giòn vỏ mềm ruột, thịt chân giò luộc mỏng dính, chả cốm dẻo thơm, dồi sụn nướng than hoa và nem rán.', tags: 'bún đậu, mắm tôm, thập cẩm, chả cốm, dồi sụn', calo: 720, p: 40, c: 70, f: 30 },
    { cat: 'Ăn kèm', name: 'Đĩa Dồi Sụn Chiên Nóng Giòn (Đĩa lớn)', price: 40000, desc: 'Dồi sụn nhồi thịt heo sụn non giòn lách tách chiên vàng ruộm.', tags: 'dồi sụn, giòn sần sật', calo: 310, p: 18, c: 10, f: 22 },
    { cat: 'Ăn kèm', name: 'Chả Cốm Làng Vòng Rán Nóng (4 miếng)', price: 30000, desc: 'Cốm non mùa thu Hà Nội dẻo thơm quyện giò sống chiên giòn.', tags: 'chả cốm, lúa mới, dẻo thơm', calo: 250, p: 14, c: 22, f: 12 },
  ],
  { cat: 'Bún Đậu', name: 'Mẹt Bún Đậu Đặc Biệt 2 Người Ăn Thả Ga', price: 120000, desc: 'Mẹt tre khổng lồ gồm 8 món topping thượng hạng phủ kín mẹt ăn cùng mắm tôm đánh sủi bọt ngập tràn.', tags: 'mẹt 2 người, khổng lồ, best-seller', calo: 1100, p: 68, c: 110, f: 45 },
  [
    { cat: 'Giải khát', name: 'Nước Sấu Ngâm Đường Gừng Phố Cổ', price: 15000, desc: 'Quả sấu già giòn chua thanh dịu ngọt.', tags: 'nước sấu', calo: 90, p: 0, c: 22, f: 0 },
    { cat: 'Trà', name: 'Trà Chanh Chùa Láng Thơm Ngát', price: 15000, desc: 'Trà lài pha chanh tươi mật ong.', tags: 'trà chanh', calo: 85, p: 0, c: 21, f: 0 },
  ]
));

// -------------------------------------------------------------
// TẠO TIẾP CÁC QUÁN TỪ 11 ĐẾN 100 ĐỦ MỌI PHÂN KHÚC
// -------------------------------------------------------------
const remainingSpecs = [
  // CƠM TẤM (3 quán)
  { id: 11, name: 'Cơm Tấm Ba Ghiền Cali', owner: 'Trần Văn Ghiền', phone: '0901000011', email: 'quan11_baghien@foodai.vn', addr: '84 Đặng Văn Ngữ, Phú Nhuận, TP.HCM', map: 'https://www.google.com/maps?q=10.7932,106.6711', d: 'Phú Nhuận', c: 'TP.HCM', lat: 10.7932, lng: 106.6711, cui: 'Cơm tấm sườn to, Sườn bì chả', r: 4.9, rev: 680, desc: 'Miếng sườn cốt lết khổng lồ nướng than mọng mật ong trứ danh Sài Gòn.' },
  { id: 12, name: 'Cơm Tấm Phúc Lộc Thọ Bình Thạnh', owner: 'Nguyễn Lộc Thọ', phone: '0901000012', email: 'quan12_phucloctho@foodai.vn', addr: '130 Ung Văn Khiêm, Bình Thạnh, TP.HCM', map: 'https://www.google.com/maps?q=10.8035,106.7162', d: 'Bình Thạnh', c: 'TP.HCM', lat: 10.8035, lng: 106.7162, cui: 'Cơm tấm sườn bì chả, Canh rong biển', r: 4.7, rev: 420, desc: 'Hệ thống cơm tấm hiện đại sạch sẽ với sườn nướng mềm ngon không khói.' },
  { id: 13, name: 'Cơm Tấm Thuận Kiều Chợ Lớn', owner: 'Lưu Thuận Kiều', phone: '0901000013', email: 'quan13_thuankieu@foodai.vn', addr: '54 Thuận Kiều, Phường 4, Quận 11, TP.HCM', map: 'https://www.google.com/maps?q=10.7562,106.6578', d: 'Quận 11', c: 'TP.HCM', lat: 10.7562, lng: 106.6578, cui: 'Cơm tấm sườn non, Chả cua trứng', r: 4.8, rev: 390, desc: 'Hạt tấm thơm bùi ăn cùng sườn non nướng mật ong và chả cua nướng béo ngậy.' },

  // BÁNH MÌ (3 quán)
  { id: 14, name: 'Bánh Mì Huỳnh Hoà Ô Môi', owner: 'Nguyễn Thị Huỳnh Hoà', phone: '0901000014', email: 'quan14_huynhhoa@foodai.vn', addr: '26 Lê Thị Riêng, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7711,106.6923', d: 'Quận 1', c: 'TP.HCM', lat: 10.7711, lng: 106.6923, cui: 'Bánh mì thịt nguội, Pate gan, Xôi thịt', r: 4.8, rev: 710, desc: 'Ổ bánh mì nửa ký nhân ngập tràn bơ tươi, pate gan và 6 loại thịt nguội hảo hạng.' },
  { id: 15, name: 'Bánh Mì Phượng Phố Hội', owner: 'Trương Thị Phượng', phone: '0901000015', email: 'quan15_banhmiphuong@foodai.vn', addr: '2B Phan Chu Trinh, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0225,105.8562', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0225, lng: 105.8562, cui: 'Bánh mì Hội An, Thịt xá xíu, Sốt tương ớt', r: 4.7, rev: 350, desc: 'Bánh mì vỏ nhọn giòn rụm với sốt thịt đậm đà kiểu Hội An.' },
  { id: 16, name: 'Bánh Mì Chảo Cột Điện Quán', owner: 'Vũ Văn Cột', phone: '0901000016', email: 'quan16_banhmichao@foodai.vn', addr: '71 Đặng Văn Ngữ, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0112,105.8324', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0112, lng: 105.8324, cui: 'Bánh mì chảo, Pate nóng, Bò né', r: 4.8, rev: 490, desc: 'Chảo gang xèo xèo pate nóng, trứng ốp la lòng đào và sốt chua ngọt béo ngậy chấm bánh mì giòn.' },

  // HỦ TIẾU (3 quán)
  { id: 17, name: 'Hủ Tiếu Nam Vang Đạt Phát', owner: 'Trịnh Quốc Đạt', phone: '0901000017', email: 'quan17_hutieudatphat@foodai.vn', addr: '389 Võ Văn Tần, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7708,106.6853', d: 'Quận 3', c: 'TP.HCM', lat: 10.7708, lng: 106.6853, cui: 'Hủ tiếu khô, Hủ tiếu nước, Món Nam Vang', r: 4.8, rev: 430, desc: 'Hủ tiếu khô trộn sốt chua ngọt bí truyền tôm sú tươi, gan cật heo thơm bùi.' },
  { id: 18, name: 'Hủ Tiếu Mì Gia Chợ Lớn', owner: 'Lâm Kiến Bang', phone: '0901000018', email: 'quan18_hutieucholon@foodai.vn', addr: '102 Hải Thượng Lãn Ông, Quận 5, TP.HCM', map: 'https://www.google.com/maps?q=10.7512,106.6548', d: 'Quận 5', c: 'TP.HCM', lat: 10.7512, lng: 106.6548, cui: 'Hủ tiếu mì xá xíu, Hoành thánh tôm', r: 4.7, rev: 380, desc: 'Sợi mì trứng kéo tay giòn dai chan nước dùng hầm xương ống và khô mực ngọt lịm.' },
  { id: 19, name: 'Hủ Tiếu Mực Ông Già Cali', owner: 'Ngô Thanh Mực', phone: '0901000019', email: 'quan19_hutieumuc@foodai.vn', addr: '45 Bùi Thị Xuân, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0162,105.8501', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0162, lng: 105.8501, cui: 'Hủ tiếu mực tươi, Nước dùng tôm', r: 4.7, rev: 290, desc: 'Mực ống tươi dày cùi giòn ngọt sần sật trong nước dùng ngọt đậm đà.' },

  // CHÁO (3 quán)
  { id: 20, name: 'Cháo Sườn Niêu Đất Chợ Đồng Xuân', owner: 'Bà Bé Cháo', phone: '0901000020', email: 'quan20_chaosuan@foodai.vn', addr: '14 Đồng Xuân, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0369,105.8495', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0369, lng: 105.8495, cui: 'Cháo sườn sụn, Ruốc thịt heo, Quẩy nóng', r: 4.8, rev: 520, desc: 'Cháo nấu từ bột gạo xay mịn màng sánh mịn, sườn sụn ninh giòn rụm rắc ruốc thịt đậm đà.' },
  { id: 21, name: 'Cháo Lòng Tiết Canh Phố Bà Triệu', owner: 'Trần Văn Lòng', phone: '0901000021', email: 'quan21_chaolong@foodai.vn', addr: '88 Bà Triệu, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0212,105.8512', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0212, lng: 105.8512, cui: 'Cháo lòng, Dồi tiết, Dạ dày luộc', r: 4.6, rev: 310, desc: 'Bát cháo lòng nâu ấm sực hạt tiêu, dồi mỡ giòn béo, lòng non trắng phau giòn sần sật.' },
  { id: 22, name: 'Cháo Ếch Geylang Xứ Khói', owner: 'Lâm Gia Tuấn', phone: '0901000022', email: 'quan22_chaoech@foodai.vn', addr: '29 Nguyễn Thái Học, Ba Đình, Hà Nội', map: 'https://www.google.com/maps?q=21.0315,105.8398', d: 'Ba Đình', c: 'Hà Nội', lat: 21.0315, lng: 105.8398, cui: 'Cháo ếch Singapore, Sốt sa tế cay', r: 4.8, rev: 340, desc: 'Thịt ếch đồng săn chắc kho tộ sền sệt sốt cay nồng ăn kèm niêu cháo trắng hoa mai thơm mùi lá dứa.' },

  // XÔI (3 quán)
  { id: 23, name: 'Xôi Mây Xéo Làng Tương', owner: 'Nguyễn Bích Bở', phone: '0901000023', email: 'quan23_xoimay@foodai.vn', addr: '35 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0239,105.8521', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0239, lng: 105.8521, cui: 'Xôi xéo mỡ gà, Hành phi giòn, Đậu xanh mịn', r: 4.9, rev: 610, desc: 'Đỗ xanh thái mỏng mịn như bơ quyện cùng hành phi giòn tan và mỡ gà thơm nức mũi.' },
  { id: 24, name: 'Xôi Yến Phố Cổ Nguyễn Hữu Huân', owner: 'Hoàng Yến Phố', phone: '0901000024', email: 'quan24_xoiyen@foodai.vn', addr: '35B Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0331,105.8542', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0331, lng: 105.8542, cui: 'Xôi xéo thịt kho, Pate trứng, Chả mực', r: 4.7, rev: 490, desc: 'Thương hiệu xôi trứ danh với hàng chục loại topping thịt kho tàu, chả mực Hạ Long, trứng ốp la.' },
  { id: 25, name: 'Xôi Gà Bà Chiểu Đêm', owner: 'Bà Chiểu Gà', phone: '0901000025', email: 'quan25_xoigabachieu@foodai.vn', addr: '318 Bùi Hữu Nghĩa, Bình Thạnh, TP.HCM', map: 'https://www.google.com/maps?q=10.8015,106.6972', d: 'Bình Thạnh', c: 'TP.HCM', lat: 10.8015, lng: 106.6972, cui: 'Xôi gà xá xíu, Sốt cay nồng, Da gà chiên', r: 4.8, rev: 530, desc: 'Xôi dẻo đẫm nước sốt cay ngọt, đùi gà chiên giòn rụm và thịt xá xíu mềm thơm.' },

  // CƠM BÌNH DÂN & CƠM NIÊU (4 quán)
  { id: 26, name: 'Cơm Quê Mẹ Nấu Duy Tân', owner: 'Đỗ Thị Hiền', phone: '0901000026', email: 'quan26_commenau@foodai.vn', addr: '18 Duy Tân, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0312,105.7821', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0312, lng: 105.7821, cui: 'Cơm văn phòng, Thịt kho tàu, Canh cua', r: 4.6, rev: 340, desc: 'Bữa cơm trưa văn phòng đậm đà chuẩn vị cơm mẹ nấu, nguyên liệu tươi sạch mỗi ngày.' },
  { id: 27, name: 'Cơm Niêu Đập Nước Mắm Sài Thành', owner: 'Huỳnh Văn Niêu', phone: '0901000027', email: 'quan27_comnieusaigon@foodai.vn', addr: '59 Hồ Xuân Hương, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7765,106.6908', d: 'Quận 3', c: 'TP.HCM', lat: 10.7765, lng: 106.6908, cui: 'Cơm niêu đập, Cá bống kho tộ, Canh chua', r: 4.8, rev: 510, desc: 'Cơm niêu đập cháy hai mặt vàng ươm giòn tan rưới mỡ hành thơm phức chấm cá kho tộ kẹo đường.' },
  { id: 28, name: 'Cơm Niêu Singapore Kombo', owner: 'Trần Singapore', phone: '0901000028', email: 'quan28_kombo@foodai.vn', addr: '60 Lê Văn Hưu, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0185,105.8531', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0185, lng: 105.8531, cui: 'Cơm niêu bò sốt tiêu đen, Gà nấm', r: 4.7, rev: 380, desc: 'Cơm niêu cháy giòn sốt BBQ và tiêu đen thơm lừng kiểu Singapore.' },
  { id: 29, name: 'Cơm Rang Dưa Bò Phố Mã Mây', owner: 'Ngô Thanh Hải', phone: '0901000029', email: 'quan29_comrangmabay@foodai.vn', addr: '38 Mã Mây, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0348,105.8528', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0348, lng: 105.8528, cui: 'Cơm rang dưa bò, Cơm đảo gà nấm', r: 4.8, rev: 410, desc: 'Cơm đảo hạt vàng săn giòn rụm bên ngoài xốp mềm bên trong, thịt bò mềm xào dưa cải chua ngọt.' },

  // BÁNH CUỐN (2 quán)
  { id: 30, name: 'Bánh Cuốn Nóng Bà Hoành Phố', owner: 'Vũ Thị Vân', phone: '0901000030', email: 'quan30_banhcuonbahoanh@foodai.vn', addr: '66 Tô Hiến Thành, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0152,105.8504', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0152, lng: 105.8504, cui: 'Bánh cuốn tráng tay, Chả quế nướng', r: 4.7, rev: 330, desc: 'Bánh cuốn tráng tay mỏng như lụa rắc hành phi giòn tan và chả quế nướng chấm mắm cà cuống.' },
  { id: 31, name: 'Bánh Ướt Lòng Gà Đà Lạt Phố', owner: 'Đặng Thanh Thảo', phone: '0901000031', email: 'quan31_banhuotlongga@foodai.vn', addr: '128 Ung Văn Khiêm, Bình Thạnh, TP.HCM', map: 'https://www.google.com/maps?q=10.8038,106.7155', d: 'Bình Thạnh', c: 'TP.HCM', lat: 10.8038, lng: 106.7155, cui: 'Bánh ướt lòng gà, Trứng non, Nước mắm chua ngọt', r: 4.8, rev: 360, desc: 'Bánh ướt mềm mướt ăn cùng lòng mề gà xào thơm, thịt gà xé và trứng non béo ngậy.' },

  // MÌ QUẢNG (2 quán)
  { id: 32, name: 'Mì Quảng Mỹ Sơn Phố Cổ', owner: 'Phan Mỹ Sơn', phone: '0901000032', email: 'quan32_miquangmyson@foodai.vn', addr: '36 Ngõ Trạm, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0319,105.8459', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0319, lng: 105.8459, cui: 'Mì Quảng tôm thịt, Bánh tráng mè', r: 4.7, rev: 270, desc: 'Sợi mì nghệ vàng tươi, nước nhưn tôm rim đậm đà rắc đậu phộng rang giòn thơm bùi.' },
  { id: 33, name: 'Bánh Tráng Cuốn Thịt Heo Hoàng Bèo', owner: 'Lê Hoàng Bèo', phone: '0901000033', email: 'quan33_hoangbeo@foodai.vn', addr: '40 Duy Tân, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0308,105.7835', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0308, lng: 105.7835, cui: 'Bánh tráng cuốn thịt heo, Mắm nêm Đà Nẵng', r: 4.8, rev: 450, desc: 'Thịt heo hai đầu da luộc mềm cuốn bánh tráng phơi sương, rau rừng và mắm nêm cá cơm nguyên chất.' },

  // ỐC & HẢI SẢN BÌNH DÂN (3 quán)
  { id: 34, name: 'Ốc Đào Phố Xào Bơ Tỏi', owner: 'Trần Thị Thuỷ Ốc', phone: '0901000034', email: 'quan34_ocdao@foodai.vn', addr: '212B Nguyễn Trãi, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7634,106.6872', d: 'Quận 1', c: 'TP.HCM', lat: 10.7634, lng: 106.6872, cui: 'Ốc hương trứng muối, Ốc móng tay, Càng ghẹ', r: 4.8, rev: 520, desc: 'Quán ốc Sài Gòn trứ danh với hàng chục loại ốc tươi sống xào bơ tỏi, rang muối ớt đậm vị.' },
  { id: 35, name: 'Ốc Cay Hà Trang Đinh Liệt', owner: 'Hà Thị Trang', phone: '0901000035', email: 'quan35_ochatrang@foodai.vn', addr: '1 Đinh Liệt, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0332,105.8526', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0332, lng: 105.8526, cui: 'Ốc luộc lá chanh, Ngao hấp sả, Nem chua rán', r: 4.7, rev: 390, desc: 'Ốc mít ốc vặn luộc lá chanh giòn ngọt chấm nước mắm gừng sả ớt thần thánh cay xè lưỡi.' },
  { id: 36, name: 'Nem Chua Rán Tạm Thương Ngõ Cổ', owner: 'Đỗ Thị Tạm', phone: '0901000036', email: 'quan36_tamthuong@foodai.vn', addr: '36 Ngõ Tạm Thương, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0315,105.8475', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0315, lng: 105.8475, cui: 'Nem chua rán bọc bột, Khoai chiên bơ', r: 4.8, rev: 410, desc: 'Ngõ nem chua rán béo ngậy giòn tan nổi tiếng học sinh sinh viên chấm tương ớt cay nồng.' },

  // GÀ RÁN & FASTFOOD (3 quán)
  { id: 37, name: 'Gà Rán Pop-Eye Giòn Rụm Kiểu Mỹ', owner: 'Trần Đại Bàng', phone: '0901000037', email: 'quan37_popeye@foodai.vn', addr: '332 Cầu Giấy, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0357,105.7942', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0357, lng: 105.7942, cui: 'Gà giòn cay, Burger tôm, Khoai tây nghiền', r: 4.6, rev: 430, desc: 'Gà rán sốt cay Louisiana tẩm ướp 12 giờ chiên ngập dầu vỏ vảy xù giòn tan bùng nổ hương vị.' },
  { id: 38, name: 'Gà Rán Lotteria K-Style', owner: 'Kim Tae Young', phone: '0901000038', email: 'quan38_lotteria@foodai.vn', addr: '112 Tràng Tiền, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0252,105.8568', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0252, lng: 105.8568, cui: 'Gà sốt HS cay ngọt, Burger bò phô mai', r: 4.6, rev: 380, desc: 'Gà rán sốt đậu phộng và sốt cay ngọt Hàn Quốc quyến rũ.' },
  { id: 39, name: 'Jollibee Gà Giòn Vui Vẻ', owner: 'Lê Vui Vẻ', phone: '0901000039', email: 'quan39_jollibee@foodai.vn', addr: '354 Pasteur, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7854,106.6912', d: 'Quận 3', c: 'TP.HCM', lat: 10.7854, lng: 106.6912, cui: 'Gà giòn cay, Mì Ý sốt bò bằm, Kem sundae', r: 4.7, rev: 520, desc: 'Gà giòn sốt cay chấm sốt gravy đậm đà và mì Ý sốt cà chua ngọt thịt.' },

  // PIZZA & MÌ Ý (3 quán)
  { id: 40, name: 'Pizza 4Pi Phô Mai Nướng Lò Củi', owner: 'Trịnh Nhật Phong', phone: '0901000040', email: 'quan40_pizza4pi@foodai.vn', addr: '11B Tràng Thi, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0286,105.8488', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0286, lng: 105.8488, cui: 'Pizza 4 phô mai, Mì Ý sốt cua, Burrata', r: 4.9, rev: 820, desc: 'Pizza nướng lò củi 450 độ C với phô mai tươi thủ công kéo sợi béo ngậy hảo hạng.' },
  { id: 41, name: 'The Pizza Company Ý Phố', owner: 'Vũ Văn Ý', phone: '0901000041', email: 'quan41_pizzacompany@foodai.vn', addr: '333 Cầu Giấy, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0355,105.7948', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0355, lng: 105.7948, cui: 'Pizza hải sản sốt pesto, Cánh gà nướng BBQ', r: 4.7, rev: 410, desc: 'Đế bánh dày phủ ngập phô mai mozzarella nướng vàng ươm và hải sản tôm mực đầy đặn.' },
  { id: 42, name: 'Domino Pizza Mỹ Thượng Hạng', owner: 'Robert Lê', phone: '0901000042', email: 'quan42_domino@foodai.vn', addr: '117 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7725,106.6908', d: 'Quận 1', c: 'TP.HCM', lat: 10.7725, lng: 106.6908, cui: 'Pizza bò phô mai xúc xích, Bánh cuộn quế', r: 4.6, rev: 360, desc: 'Đế bánh nhào tay tươi mới phủ xúc xích pepperoni cay nồng và phô mai nướng chảy.' },

  // NƯỚNG & LẨU HÀN QUỐC (4 quán)
  { id: 43, name: 'King Nướng BBQ Hàn Xẻng', owner: 'Kim Dong Sung', phone: '0901000043', email: 'quan43_kingbbq@foodai.vn', addr: '241 Xuân Thủy, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0366,105.7824', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0366, lng: 105.7824, cui: 'Dẻ sườn bò Mỹ sốt King, Ba chỉ bò nấm', r: 4.8, rev: 640, desc: 'Thiên đường nướng không khói kiểu Seoul với sốt King bí truyền ướp sườn bò Mỹ hảo hạng.' },
  { id: 44, name: 'Gogi House Thịt Nướng Seoul Phố', owner: 'Park Jin Woo', phone: '0901000044', email: 'quan44_gogi@foodai.vn', addr: '103 Chùa Bộc, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0078,105.8285', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0078, lng: 105.8285, cui: 'Sườn hoàng đế, Cơm trộn thố đá, Canh kim chi', r: 4.8, rev: 590, desc: 'Thịt nướng xèo xèo trên vỉ gang chấm sốt tương đậu Hàn thơm phức ăn cùng lá vừng mè.' },
  { id: 45, name: 'Sumo Yakiniku Nướng Nhật', owner: 'Kenji Sato', phone: '0901000045', email: 'quan45_sumo@foodai.vn', addr: '67 Huỳnh Thúc Kháng, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0188,105.8112', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0188, lng: 105.8112, cui: 'Thịt bò Wagyu nướng sốt tare, Lẩu miso', r: 4.8, rev: 450, desc: 'Nghệ thuật nướng Yakiniku Nhật Bản chú trọng độ tươi mọng nguyên bản của từng thớ thịt.' },
  { id: 46, name: 'Meat & Meet Nướng Không Khói Chợ Bến Thành', owner: 'Lee Min Ho', phone: '0901000046', email: 'quan46_meatmeet@foodai.vn', addr: '8 Lê Thị Riêng, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7718,106.6935', d: 'Quận 1', c: 'TP.HCM', lat: 10.7718, lng: 106.6935, cui: 'Ba chỉ heo đen ướp tỏi, Lẩu kim chi', r: 4.7, rev: 490, desc: 'Buffet nướng phong cách container hiện đại thu hút đông đảo giới trẻ Sài Gòn.' },

  // LẨU TRUNG HOA (3 quán)
  { id: 47, name: 'Hải Đế Lao Múa Mì Lẩu 4 Ngăn', owner: 'Trương Dũng Lẩu', phone: '0901000047', email: 'quan47_haidilao@foodai.vn', addr: '2 Phạm Ngọc Thạch, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0076,105.8329', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0076, lng: 105.8329, cui: 'Lẩu cà chua, Bò ướp mềm, Múa mì tươi', r: 4.9, rev: 980, desc: 'Dịch vụ lẩu 5 sao với nồi lẩu 4 ngăn và màn trình diễn múa mì nghệ thuật độc nhất vô nhị.' },
  { id: 48, name: 'Manwah Lẩu Đài Loan Truyền Thống', owner: 'Chu Vĩnh Khang', phone: '0901000048', email: 'quan48_manwah@foodai.vn', addr: '27 Thái Hà, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0125,105.8211', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0125, lng: 105.8211, cui: 'Lẩu Mala cay tê, Lẩu nấm thanh ngọt, Há cảo', r: 4.8, rev: 530, desc: 'Nước lẩu hầm từ thảo mộc xứ Đài kết hợp đồ nhúng thịt cừu, thăn bò thượng hạng.' },
  { id: 49, name: 'Hutong Lẩu Hồng Kông Cay Nồng', owner: 'Lâm Tuệ San', phone: '0901000049', email: 'quan49_hutong@foodai.vn', addr: '34B Nguyễn Trãi, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7695,106.6912', d: 'Quận 1', c: 'TP.HCM', lat: 10.7695, lng: 106.6912, cui: 'Lẩu dạ dày gà, Lẩu sâm bổ dưỡng, Viên thả lẩu', r: 4.7, rev: 410, desc: 'Không gian ngõ nhỏ Hồng Kông với nước lẩu hầm 12 giờ thơm nồng hạt tiêu và kỷ tử.' },

  // MÌ CAY (2 quán)
  { id: 50, name: 'Mì Cay 7 Cấp Độ Sasim Korea', owner: 'Đỗ Quốc Sasim', phone: '0901000050', email: 'quan50_sasim@foodai.vn', addr: '107 Nguyễn Gia Trí, Bình Thạnh, TP.HCM', map: 'https://www.google.com/maps?q=10.8032,106.7144', d: 'Bình Thạnh', c: 'TP.HCM', lat: 10.8032, lng: 106.7144, cui: 'Mì cay hải sản, Tokbokki phô mai, Mì kim chi', r: 4.7, rev: 430, desc: 'Mì cay kim chi hải sản nấu niêu đất cay xè từ cấp độ 1 đến 7 bùng nổ vị giác.' },
  { id: 51, name: 'Mì Cay Seoul Naga Phố', owner: 'Vũ Thanh Naga', phone: '0901000051', email: 'quan51_naga@foodai.vn', addr: '202 Cầu Giấy, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0345,105.7985', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0345, lng: 105.7985, cui: 'Mì cay bò Mỹ, Chả cá Hàn Quốc, Trà đào', r: 4.6, rev: 350, desc: 'Sợi mì Hàn Quốc dai béo nấu cùng sốt ớt Naga cay nồng ấm bụng mùa đông.' },

  // SUSHI & MÓN NHẬT (3 quán)
  { id: 52, name: 'Sushi Cá Chép Koi Nhật Bản', owner: 'Kenji Takahashi', phone: '0901000052', email: 'quan52_sushikoi@foodai.vn', addr: '7 Ngô Thì Nhậm, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0187,105.8528', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0187, lng: 105.8528, cui: 'Sashimi cá hồi, Cơm cuộn bơ, Tempura', r: 4.8, rev: 380, desc: 'Ẩm thực Nhật Bản tươi sống nguyên bản với cá hồi Nauy mướt mát và cơm cuộn nghệ thuật.' },
  { id: 53, name: 'Tokyo Deli Bento Mới', owner: 'Shinjiro Mori', phone: '0901000053', email: 'quan53_tokyodeli@foodai.vn', addr: '240 Giảng Võ, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0289,105.8236', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0289, lng: 105.8236, cui: 'Cơm lươn nướng Unagi, Mì Udon dashi', r: 4.7, rev: 340, desc: 'Set cơm Bento dinh dưỡng chuẩn Nhật Bản và cơm lươn nướng sốt teriyaki thơm lừng.' },
  { id: 54, name: 'Sushi Ba Con Sóc Chợ Lớn', owner: 'Nguyễn Tấn Sóc', phone: '0901000054', email: 'quan54_sushibaconsoc@foodai.vn', addr: '47B Lương Nhữ Học, Quận 5, TP.HCM', map: 'https://www.google.com/maps?q=10.7525,106.6598', d: 'Quận 5', c: 'TP.HCM', lat: 10.7525, lng: 106.6598, cui: 'Sushi giá rẻ, Nigiri cá trích ép trứng, Gunkan', r: 4.7, rev: 490, desc: 'Sushi bình dân tươi ngon nức tiếng khu Chợ Lớn dành cho sinh viên và giới văn phòng.' },

  // DIMSUM (3 quán)
  { id: 55, name: 'Dimsum Xửng Tre Hương Cảng', owner: 'Chu Vĩnh Khang', phone: '0901000055', email: 'quan55_dimsumxungtre@foodai.vn', addr: '185 Bùi Thị Xuân, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0116,105.8502', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0116, lng: 105.8502, cui: 'Há cảo tôm thủy tinh, Bánh bao kim sa', r: 4.8, rev: 290, desc: 'Xửng tre bốc khói nghi ngút với há cảo tôm vỏ trong mỏng tang chuẩn phong vị Quảng Đông.' },
  { id: 56, name: 'San Fu Lou Quảng Đông Mỹ Vị', owner: 'Trần Cẩm San', phone: '0901000056', email: 'quan56_sanfulou@foodai.vn', addr: '76A Lê Lai, Bến Thành, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7712,106.6958', d: 'Quận 1', c: 'TP.HCM', lat: 10.7712, lng: 106.6958, cui: 'Vịt quay Bắc Kinh, Chân gà hấp tàu xì', r: 4.8, rev: 580, desc: 'Bếp mở hiện đại biểu diễn quay vịt da giòn bóng bẩy và các món xào lửa lớn Quảng Đông.' },
  { id: 57, name: 'Meiwei Dimsum Cổ Truyền', owner: 'Lưu Đức Hòa', phone: '0901000057', email: 'quan57_meiwei@foodai.vn', addr: '222 Trần Duy Hưng, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0068,105.7952', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0068, lng: 105.7952, cui: 'Xíu mại trứng cua, Bánh cuốn tôm tẩm mè', r: 4.7, rev: 320, desc: 'Bữa tiệc trà chiều Dimsum với hơn 50 món hấp, chiên, xào đậm đà phong vị Trung Hoa.' },

  // CÀ PHÊ (4 quán)
  { id: 58, name: 'Highland Hills Coffee Tràng Tiền', owner: 'Nguyễn Thái Bình', phone: '0901000058', email: 'quan58_highlandhills@foodai.vn', addr: '1 Tràng Tiền, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0248,105.8576', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0248, lng: 105.8576, cui: 'Trà sen vàng, Phin sữa đá, Freeze matcha', r: 4.8, rev: 950, desc: 'Cà phê view Nhà Hát Lớn sang trọng với trà sen vàng củ năng giòn ngọt trứ danh.' },
  { id: 59, name: 'The Kafa House Cà Phê Mộc', owner: 'Lê Văn Mộc', phone: '0901000059', email: 'quan59_thekafahouse@foodai.vn', addr: '18 Hàng Bạc, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0346,105.8512', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0346, lng: 105.8512, cui: 'Cà phê rang mộc, Cốt dừa cà phê, Bạc xỉu', r: 4.7, rev: 460, desc: 'Không gian vỉa hè rộng mở đậm chất phố cổ với hương cà phê rang mộc thơm ngào ngạt.' },
  { id: 60, name: 'Cộng Cà Phê Bao Cấp Xưa', owner: 'Bùi Thị Cộng', phone: '0901000060', email: 'quan60_congcaphe@foodai.vn', addr: '32 Điện Biên Phủ, Ba Đình, Hà Nội', map: 'https://www.google.com/maps?q=21.0328,105.8415', d: 'Ba Đình', c: 'Hà Nội', lat: 21.0328, lng: 105.8415, cui: 'Cà phê cốt dừa, Cà phê trứng, Bánh sắn nướng', r: 4.8, rev: 720, desc: 'Không gian hoài niệm thời bao cấp Việt Nam với món cà phê cốt dừa ngọt béo nổi tiếng thế giới.' },
  { id: 61, name: 'Phúc Long Trà & Cà Phê Ngô Đức Kế', owner: 'Lâm Phúc Long', phone: '0901000061', email: 'quan61_phuclong@foodai.vn', addr: '63 Ngô Đức Kế, Bến Nghé, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7728,106.7042', d: 'Quận 1', c: 'TP.HCM', lat: 10.7728, lng: 106.7042, cui: 'Trà đào cam sả, Trà sữa Phúc Long đậm vị', r: 4.8, rev: 890, desc: 'Hương vị trà Bảo Lộc nguyên bản đậm đà chát thanh thơm nức mũi chiếm trọn trái tim giới trẻ.' },

  // TRÀ SỮA (4 quán)
  { id: 62, name: 'Trà Sữa Gong-Trà Đài Loan', owner: 'Trần Diệu Hương', phone: '0901000062', email: 'quan62_gongtra@foodai.vn', addr: '25 Quang Trung, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0212,105.8491', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0212, lng: 105.8491, cui: 'Trà Alisan Milkfoam, Trân châu hoàng kim', r: 4.7, rev: 510, desc: 'Lớp kem sữa Milkfoam béo mặn sánh mịn uống không cần ống hút nổi danh xứ Đài.' },
  { id: 63, name: 'Trà Sữa Toco Toco Trân Châu Sợi', owner: 'Nguyễn Toco', phone: '0901000063', email: 'quan63_tocotoco@foodai.vn', addr: '19 Cầu Giấy, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0325,105.8021', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0325, lng: 105.8021, cui: 'Trà sữa ba anh em, Trân châu sợi củ sắn', r: 4.6, rev: 420, desc: 'Nông sản Việt Nam lên ngôi với trân châu sợi dẻo dai từ củ sắn Nghệ An.' },
  { id: 64, name: 'Trà Sữa Koi Thé Macchiato', owner: 'Tan Chuan Jin', phone: '0901000064', email: 'quan64_koithe@foodai.vn', addr: '120 Pasteur, Bến Nghé, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7758,106.7001', d: 'Quận 1', c: 'TP.HCM', lat: 10.7758, lng: 106.7001, cui: 'Lục trà macchiato, Trân châu hoàng kim', r: 4.8, rev: 760, desc: 'Thương hiệu trà sữa cao cấp Singapore với lớp kem macchiato dày xốp béo ngậy ngọt ngào.' },
  { id: 65, name: 'Trà Sữa The Alley Sữa Tươi Đường Đen', owner: 'Vương Lôi Alley', phone: '0901000065', email: 'quan65_thealley@foodai.vn', addr: '24 Lê Đại Hành, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0118,105.8485', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0118, lng: 105.8485, cui: 'Sữa tươi trân châu đường đen, Trà đào', r: 4.7, rev: 610, desc: 'Trân châu đường đen thủ công nấu liên tục 2 giờ ngập trong dòng sữa tươi thanh trùng béo ngậy.' },

  // CHÈ & TRÁNG MIỆNG (3 quán)
  { id: 66, name: 'Chè Ngon Cung Đình Mây Phố Hàng Bạc', owner: 'Hoàng Kim Liên', phone: '0901000066', email: 'quan66_chehangbac@foodai.vn', addr: '93 Hàng Bạc, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0341,105.8529', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0341, lng: 105.8529, cui: 'Chè khúc bạch phô mai, Chè thái sầu riêng', r: 4.8, rev: 310, desc: 'Từng viên khúc bạch phô mai dẻo bùi trong nước đường phèn nhãn lồng thơm ngát hạnh nhân lát.' },
  { id: 67, name: 'Chè Mâm 16 Món Sư Vạn Hạnh', owner: 'Nguyễn Thị Mâm', phone: '0901000067', email: 'quan67_chemam@foodai.vn', addr: '242 Sư Vạn Hạnh, Phường 2, Quận 10, TP.HCM', map: 'https://www.google.com/maps?q=10.7612,106.6685', d: 'Quận 10', c: 'TP.HCM', lat: 10.7612, lng: 106.6685, cui: 'Mâm chè 16 chén, Chè bà ba, Chè thưng', r: 4.8, rev: 560, desc: 'Thưởng thức cùng lúc 16 chén chè miền Tây từ chè đậu trắng, chè trôi nước đến chè bưởi thơm nức cốt dừa.' },
  { id: 68, name: 'Tàu Hũ Nóng Trân Châu Đêm', owner: 'Lê Văn Hũ', phone: '0901000068', email: 'quan68_tauhudem@foodai.vn', addr: '185 Bàn Cờ, Phường 3, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7685,106.6812', d: 'Quận 3', c: 'TP.HCM', lat: 10.7685, lng: 106.6812, cui: 'Tàu hũ nước đường gừng, Tàu hũ sầu riêng', r: 4.7, rev: 340, desc: 'Tàu hũ non mềm mịn như nhung chan nước đường thốt nốt nấu gừng cay ấm bụng rắc trân châu dai dai.' },

  // ĐỒ CHAY & HEALTHY (3 quán)
  { id: 69, name: 'Cơm Chay Ưu Đàm Thanh Tịnh', owner: 'Thích Thanh Chay', phone: '0901000069', email: 'quan69_uudamchay@foodai.vn', addr: '34 Hàng Bài, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0228,105.8525', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0228, lng: 105.8525, cui: 'Ẩm thực chay, Lẩu nấm chay, Nem nấm', r: 4.9, rev: 490, desc: 'Không gian thiền tịnh an yên với các món chay thực dưỡng chế biến từ rau củ quả hữu cơ cao cấp.' },
  { id: 70, name: 'Bếp Xanh Healthy Salad & Poke', owner: 'Trần Thanh Clean', phone: '0901000070', email: 'quan70_bepxanhhealthy@foodai.vn', addr: '56 Duy Tân, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0315,105.7845', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0315, lng: 105.7845, cui: 'Salad ức gà, Poke bowl cá hồi, Nước ép detox', r: 4.8, rev: 380, desc: 'Thực đơn giảm cân eat-clean cân đối macro calories, protein, carbs và chất béo lành mạnh.' },
  { id: 71, name: 'Chay Tâm Đức Nam Kỳ Khởi Nghĩa', owner: 'Nguyễn Tâm Đức', phone: '0901000071', email: 'quan71_tamducchay@foodai.vn', addr: '140 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7785,106.6975', d: 'Quận 1', c: 'TP.HCM', lat: 10.7785, lng: 106.6975, cui: 'Hủ tiếu chay, Cơm chiên sen, Đậu hũ Tứ Xuyên', r: 4.7, rev: 320, desc: 'Bữa cơm chay thanh đạm đầy ắp hương vị thiên nhiên giúp tâm hồn nhẹ nhõm.' },

  // ĐẶC SẢN VÙNG MIỀN (DÊ NÚI, BÒ TƠ, LẨU BÒ... 4 quán)
  { id: 72, name: 'Dê Núi Ninh Bình Tái Chanh Hoa Sen', owner: 'Nguyễn Văn Dê', phone: '0901000072', email: 'quan72_denuinhbinh@foodai.vn', addr: '12 Trung Kính, Cầu Giấy, Hà Nội', map: 'https://www.google.com/maps?q=21.0185,105.7958', d: 'Cầu Giấy', c: 'Hà Nội', lat: 21.0185, lng: 105.7958, cui: 'Dê tái chanh, Dê nướng tảng, Lẩu ngọc dương', r: 4.8, rev: 410, desc: 'Thịt dê núi Ninh Bình thả tự nhiên ăn lá thuốc, thịt ngọt đậm không hôi xào lăn hoặc nướng tảng than hoa.' },
  { id: 73, name: 'Bò Tơ Tây Ninh Năm Sánh Mới', owner: 'Võ Năm Sánh', phone: '0901000073', email: 'quan73_bototayninh@foodai.vn', addr: '86 Phạm Văn Đồng, Gò Vấp, TP.HCM', map: 'https://www.google.com/maps?q=10.8245,106.6895', d: 'Gò Vấp', c: 'TP.HCM', lat: 10.8245, lng: 106.6895, cui: 'Bò tơ nướng y, Bò tái chanh, Lẩu đuôi bò', r: 4.8, rev: 560, desc: 'Thịt bò tơ da mỏng mềm ngọt nướng xèo xèo cuốn bánh tráng phơi sương Trảng Bàng chấm mắm nêm.' },
  { id: 74, name: 'Nem Nướng Nha Trang Cô Ba Xứ Biển', owner: 'Trịnh Thị Nha', phone: '0901000074', email: 'quan74_nemnhatrang@foodai.vn', addr: '12 Đặng Văn Ngữ, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0105,105.8315', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0105, lng: 105.8315, cui: 'Nem nướng que tre, Ram giòn, Nước chấm nếp', r: 4.8, rev: 470, desc: 'Nem thịt heo nướng vàng óng cuộn cùng ram chiên giòn tan và xoài xanh chấm nước sốt tôm thịt béo ngậy.' },
  { id: 75, name: 'Lẩu Bò Ba Toa Đà Lạt Phố', owner: 'Lâm Ba Toa', phone: '0901000075', email: 'quan75_laubobatoa@foodai.vn', addr: '158 Ung Văn Khiêm, Bình Thạnh, TP.HCM', map: 'https://www.google.com/maps?q=10.8042,106.7168', d: 'Bình Thạnh', c: 'TP.HCM', lat: 10.8042, lng: 106.7168, cui: 'Lẩu đuôi bò, Nạm bò, Chao môn chấm', r: 4.8, rev: 610, desc: 'Nồi lẩu bò nghi ngút khói chuẩn vị dốc Ba Toa Đà Lạt với đuôi bò giòn sần sật ninh nhừ trong nước hầm thơm thảo mộc.' },

  // FINE DINING & CAO CẤP (5 quán tiếp theo: 76 - 80)
  { id: 76, name: 'Wagyu Prime Than Hoa Thượng Hạng', owner: 'Chef Tuấn Vũ', phone: '0901000076', email: 'quan76_wagyuprime@foodai.vn', addr: '15 Ngô Quyền, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0268,105.8561', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0268, lng: 105.8561, cui: 'Bò Wagyu A5 Miyazaki, Teppanyaki, Rượu vang', r: 5.0, rev: 240, desc: 'Đỉnh cao thịt bò Wagyu A5 nhập khẩu chính ngạch từ Nhật Bản với vân mỡ hoa cẩm thạch tan chảy.' },
  { id: 77, name: 'Hải Sản Hoàng Gia Cua King Crab', owner: 'Trần Đại Cua', phone: '0901000077', email: 'quan77_kingcrab@foodai.vn', addr: '180 Pasteur, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7818,106.6974', d: 'Quận 1', c: 'TP.HCM', lat: 10.7818, lng: 106.6974, cui: 'King Crab Alaska, Tôm hùm bông, Bào ngư', r: 4.9, rev: 310, desc: 'Chuyên hải sản tươi sống khổng lồ bơi lội trong bể kính, đút lò phô mai Pháp hoặc hấp rượu vang.' },
  { id: 78, name: 'Le Ciel Đệ Nhất Ẩm Thực Pháp', owner: 'Jean-Luc Nguyễn', phone: '0901000078', email: 'quan78_leciel@foodai.vn', addr: '2 Lê Phụng Hiểu, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0261,105.8569', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0261, lng: 105.8569, cui: 'Beef Wellington, Gan ngỗng Foie Gras, Souffle', r: 5.0, rev: 180, desc: 'Thực đơn tasting menu 7 món chuẩn sao Michelin trong không gian biệt thự Pháp cổ kính lãng mạn.' },
  { id: 79, name: 'Sato Omakase Cá Ngừ Vây Xanh', owner: 'Daiki Sato', phone: '0901000079', email: 'quan79_satoomakase@foodai.vn', addr: '12 Thi Sách, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7762,106.7038', d: 'Quận 1', c: 'TP.HCM', lat: 10.7762, lng: 106.7038, cui: 'Omakase, Bụng cá ngừ Otoro, Nhím biển Uni', r: 5.0, rev: 160, desc: 'Trải nghiệm ẩm thực Omakase riêng tư với nguyên liệu tươi sống bay trực tiếp từ chợ cá Toyosu Tokyo.' },
  { id: 80, name: 'Annam Heritage Ẩm Thực Việt Đương Đại', owner: 'Chef Đặng Đình An', phone: '0901000080', email: 'quan80_annamheritage@foodai.vn', addr: '11 Tràng Tiền, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0255,105.8564', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0255, lng: 105.8564, cui: 'Ẩm thực Việt đương đại, Cá tuyết rượu nếp, Bồ câu mắc khén', r: 5.0, rev: 280, desc: 'Nâng tầm ẩm thực Việt Nam lên đẳng cấp thế giới kết hợp kỹ thuật nấu ăn phân tử và gia vị bản địa.' },

  // CÁC QUÁN BÌNH DÂN & ĐẶC SẢN THÊM (81 - 100 ĐỂ ĐẠT ĐỦ 100 QUÁN)
  { id: 81, name: 'Bún Cá Cay Hải Phòng Phố Cổ', owner: 'Đỗ Hải Phòng', phone: '0901000081', email: 'quan81_buncacay@foodai.vn', addr: '107 Giảng Võ, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0275,105.8242', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0275, lng: 105.8242, cui: 'Bún cá rô đồng chiên giòn, Lòng cá, Nước me', r: 4.7, rev: 290, desc: 'Cá rô phi lọc thịt chiên vàng giòn rụm trong nước dùng ninh xương cá chua cay thơm nồng dọc mùng.' },
  { id: 82, name: 'Bánh Đa Cua Bể Đất Cảng', owner: 'Vũ Thị Cua', phone: '0901000082', email: 'quan82_banhdacua@foodai.vn', addr: '6 Phùng Hưng, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0335,105.8458', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0335, lng: 105.8458, cui: 'Bánh đa đỏ cua đồng, Chả lá lốt, Tôm sú', r: 4.8, rev: 360, desc: 'Sợi bánh đa đỏ dẻo dai chan ngập riêu cua đồng béo ngậy, chả lá lốt thơm lừng và rau muống giòn ngọt.' },
  { id: 83, name: 'Bún Nước Lèo Sóc Trăng Cá Lóc', owner: 'Thạch Kim Sóc', phone: '0901000083', email: 'quan83_bunnuocleo@foodai.vn', addr: '155 Võ Thị Sáu, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7845,106.6905', d: 'Quận 3', c: 'TP.HCM', lat: 10.7845, lng: 106.6905, cui: 'Bún nước lèo, Cá lóc đồng, Tôm đất, Heo quay', r: 4.8, rev: 330, desc: 'Hương vị mắm bồ hóc đặc trưng nấu ngải bún thanh ngọt ăn cùng thịt cá lóc đồng và heo quay da giòn.' },
  { id: 84, name: 'Bún Mắm Miền Tây Tôm Càng Mực Ống', owner: 'Lê Văn Mắm', phone: '0901000084', email: 'quan84_bunmam@foodai.vn', addr: '368 Lê Hồng Phong, Quận 10, TP.HCM', map: 'https://www.google.com/maps?q=10.7635,106.6742', d: 'Quận 10', c: 'TP.HCM', lat: 10.7635, lng: 106.6742, cui: 'Bún mắm Châu Đốc, Tôm càng xanh, Mực tươi', r: 4.8, rev: 420, desc: 'Nước dùng nấu từ mắm cá linh, mắm cá sặc đậm đà ngát hương sả ớt ăn cùng đĩa rau đắng rau muống bắp chuối ngút ngàn.' },
  { id: 85, name: 'Cháo Ếch Đêm Phố Tây Bùi Viện', owner: 'Trương Quốc Ếch', phone: '0901000085', email: 'quan85_chaoechbuivien@foodai.vn', addr: '124 Bùi Viện, Quận 1, TP.HCM', map: 'https://www.google.com/maps?q=10.7672,106.6925', d: 'Quận 1', c: 'TP.HCM', lat: 10.7672, lng: 106.6925, cui: 'Cháo ếch kho sả ớt, Ăn đêm', r: 4.7, rev: 380, desc: 'Điểm hẹn ăn đêm quen thuộc khu phố Tây với niêu ếch kho cay xè lưỡi ấm lòng thực khách.' },
  { id: 86, name: 'Bánh Mì Nướng Muối Ớt Chợ Lớn', owner: 'Lưu Thị Muối', phone: '0901000086', email: 'quan86_banhminuong@foodai.vn', addr: '215 Nguyễn Tri Phương, Quận 5, TP.HCM', map: 'https://www.google.com/maps?q=10.7582,106.6675', d: 'Quận 5', c: 'TP.HCM', lat: 10.7582, lng: 106.6675, cui: 'Bánh mì nướng muối ớt, Tép sấy, Mỡ hành', r: 4.8, rev: 490, desc: 'Bánh mì cán dẹp nướng giòn rụm phết sốt muối ớt bơ thơm rắc chà bông, xúc xích và tép sấy cay ngọt.' },
  { id: 87, name: 'Bánh Tráng Trộn Long An Cô Ba', owner: 'Nguyễn Thị Trộn', phone: '0901000087', email: 'quan87_banhtrangtron@foodai.vn', addr: '38 Nguyễn Thượng Hiền, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7745,106.6855', d: 'Quận 3', c: 'TP.HCM', lat: 10.7745, lng: 106.6855, cui: 'Bánh tráng trộn, Bò khô, Trứng cút, Xoài bào', r: 4.9, rev: 610, desc: 'Thánh địa bánh tráng trộn Nguyễn Thượng Hiền với sợi bánh tráng dẻo thấm đẫm sa tế tôm và nước sốt bò đen.' },
  { id: 88, name: 'Bột Chiên Trứng Giòn Rụm Chợ Lớn', owner: 'Hà Vĩnh Bột', phone: '0901000088', email: 'quan88_botchien@foodai.vn', addr: '185 Phùng Hưng, Quận 5, TP.HCM', map: 'https://www.google.com/maps?q=10.7545,106.6575', d: 'Quận 5', c: 'TP.HCM', lat: 10.7545, lng: 106.6575, cui: 'Bột chiên giòn, Trứng gà, Đu đủ bào', r: 4.8, rev: 390, desc: 'Khối bột gạo chiên xém giòn vỏ ngoài dẻo ruột trong cùng 2 trứng gà ta béo ngậy chấm nước tương chua ngọt đu đủ giòn sần sật.' },
  { id: 89, name: 'Chè Bưởi An Giang Nước Cốt Dừa', owner: 'Lâm Bưởi Non', phone: '0901000089', email: 'quan89_chebuoi@foodai.vn', addr: '82 Bà Triệu, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0215,105.8510', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0215, lng: 105.8510, cui: 'Chè bưởi, Đậu xanh, Cốt dừa béo', r: 4.8, rev: 340, desc: 'Cùi bưởi giòn sần sật không chút vị đắng kết hợp đỗ xanh ninh mềm và nước cốt dừa thơm béo ngậy.' },
  { id: 90, name: 'Trà Sữa Nướng Vân Nam Hũ Đất', owner: 'Trương Vân Nam', phone: '0901000090', email: 'quan90_trasuanuong@foodai.vn', addr: '5 Hàng Chiếu, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0365,105.8515', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0365, lng: 105.8515, cui: 'Trà sữa nướng, Thảo mộc, Táo đỏ', r: 4.8, rev: 410, desc: 'Trà phổ nhĩ nướng trực tiếp trên than hồng trong hũ đất nung cùng sữa tươi, táo đỏ và kỷ tử thơm lừng.' },
  { id: 91, name: 'Bánh Mì Kebab Thổ Nhĩ Kỳ Phố Huế', owner: 'Mahmut Đỗ', phone: '0901000091', email: 'quan91_donerkebab@foodai.vn', addr: '138 Phố Huế, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0165,105.8522', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0165, lng: 105.8522, cui: 'Doner Kebab, Thịt nướng xiên quay, Bắp cải tím', r: 4.7, rev: 330, desc: 'Bánh mì tam giác nướng giòn kẹp thịt nướng quay tròn thơm lừng gia vị thì là và sốt tỏi sữa chua.' },
  { id: 92, name: 'Cơm Gà Tam Kỳ Xứ Quảng Mới', owner: 'Phan Tam Kỳ', phone: '0901000092', email: 'quan92_comgatamky@foodai.vn', addr: '45 Lê Văn Sỹ, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7895,106.6785', d: 'Quận 3', c: 'TP.HCM', lat: 10.7895, lng: 106.6785, cui: 'Cơm gà luộc, Gà xé bóp gỏi, Canh lòng', r: 4.8, rev: 390, desc: 'Cơm dẻo nấu bằng nước luộc gà béo vàng, thịt gà ta xé bóp gỏi chua ngọt ăn kèm tương ớt phố cổ cay nồng.' },
  { id: 93, name: 'Bún Sườn Chua Dọc Mùng Xã Đàn', owner: 'Nguyễn Thị Mùng', phone: '0901000093', email: 'quan93_bunsuonchua@foodai.vn', addr: '240 Xã Đàn, Đống Đa, Hà Nội', map: 'https://www.google.com/maps?q=21.0135,105.8345', d: 'Đống Đa', c: 'Hà Nội', lat: 21.0135, lng: 105.8345, cui: 'Bún sườn sụn, Dọc mùng tước vỏ, Nước me chua', r: 4.8, rev: 360, desc: 'Nước dùng nấu cà chua và me chua thanh mát, sườn non ninh róc thịt và dọc mùng giòn sần sật không ngứa.' },
  { id: 94, name: 'Bánh Giò Nóng Thịt Băm Nấm Hương Chợ Hôm', owner: 'Bà Bích Giò', phone: '0901000094', email: 'quan94_banhgionong@foodai.vn', addr: '79 Phố Huế, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0185,105.8518', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0185, lng: 105.8518, cui: 'Bánh giò nóng, Giò thủ, Chả cốm, Dưa chuột muối', r: 4.8, rev: 450, desc: 'Bánh giò bốc khói nghi ngút vỏ bột gạo dẻo mềm nhân đầy ắp thịt băm mộc nhĩ nấm hương ăn kèm giò tai giòn rụm.' },
  { id: 95, name: 'Súp Cua Trứng Bắc Thảo Chợ Thiếc', owner: 'Trần Thị Cua', phone: '0901000095', email: 'quan95_supcua@foodai.vn', addr: '166 Phó Cơ Điều, Quận 11, TP.HCM', map: 'https://www.google.com/maps?q=10.7575,106.6565', d: 'Quận 11', c: 'TP.HCM', lat: 10.7575, lng: 106.6565, cui: 'Súp cua óc heo, Trứng bắc thảo, Thanh cua', r: 4.8, rev: 510, desc: 'Tô súp cua sánh đặc ngập tràn thịt cua biển, trứng bắc thảo bùi béo và óc heo bổ dưỡng rưới dầu mè thơm nức.' },
  { id: 96, name: 'Bánh Đúc Nóng Thịt Băm Mộc Nhĩ Lê Ngọc Hân', owner: 'Bà Nội Bánh Đúc', phone: '0901000096', email: 'quan96_banhducnong@foodai.vn', addr: '8 Lê Ngọc Hân, Hai Bà Trưng, Hà Nội', map: 'https://www.google.com/maps?q=21.0175,105.8535', d: 'Hai Bà Trưng', c: 'Hà Nội', lat: 21.0175, lng: 105.8535, cui: 'Bánh đúc nóng, Thịt băm mộc nhĩ, Hành phi giòn', r: 4.9, rev: 480, desc: 'Bánh đúc dẻo quánh ấm nóng chan nước mắm giấm đường ngọt dịu, thịt băm xào mộc nhĩ đậm đà rắc hành phi thơm nức mũi.' },
  { id: 97, name: 'Chả Cá Lã Vọng Phố Cổ Gia Truyền', owner: 'Đoàn Xuân Lã', phone: '0901000097', email: 'quan97_chacalavong@foodai.vn', addr: '14 Chả Cá, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0345,105.8492', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0345, lng: 105.8492, cui: 'Chả cá lăng nướng than, Thì là hành hoa, Mắm tôm', r: 4.9, rev: 670, desc: 'Cá lăng tươi ngọt nướng than hoa xào xèo xèo cùng thì là hành hoa trên chảo mỡ sôi, chấm mắm tôm bông bọt đậu phộng rang giòn.' },
  { id: 98, name: 'Bánh Tráng Nướng Đà Lạt Pizza Việt', owner: 'Cô Ba Đà Lạt', phone: '0901000098', email: 'quan98_banhtrangnuong@foodai.vn', addr: '53 Cao Thắng, Quận 3, TP.HCM', map: 'https://www.google.com/maps?q=10.7715,106.6865', d: 'Quận 3', c: 'TP.HCM', lat: 10.7715, lng: 106.6865, cui: 'Bánh tráng nướng mắm ruốc, Trứng cút, Bò khô', r: 4.8, rev: 420, desc: 'Bánh tráng mỏng nướng trên than hồng phết mắm ruốc, trứng cút lòng đào, tép khô và phô mai giòn tan rụm.' },
  { id: 99, name: 'Lẩu Riêu Cua Bắp Bò Sườn Sụn Phó Đức Chính', owner: 'Nguyễn Đức Riêu', phone: '0901000099', email: 'quan99_laurieucua@foodai.vn', addr: '66 Phó Đức Chính, Ba Đình, Hà Nội', map: 'https://www.google.com/maps?q=21.0425,105.8415', d: 'Ba Đình', c: 'Hà Nội', lat: 21.0425, lng: 105.8415, cui: 'Lẩu riêu cua bắp bò, Giấm bỗng nếp, Sườn sụn non', r: 4.9, rev: 740, desc: 'Nồi lẩu riêu cua sôi sục đỏ au gạch cua béo ngậy, bắp bò hoa nhúng tái giòn sần sật và nước dùng giấm bỗng chua thanh giải ngấy.' },
  { id: 100, name: 'Hải Sản Biển Đông Cua Ghẹ Tươi Sống', owner: 'Trần Hải Đông', phone: '09010000100', email: 'quan100_haisanbiendong@foodai.vn', addr: '3 Trần Quốc Toản, Hoàn Kiếm, Hà Nội', map: 'https://www.google.com/maps?q=21.0215,105.8505', d: 'Hoàn Kiếm', c: 'Hà Nội', lat: 21.0215, lng: 105.8505, cui: 'Ghẹ hấp bia, Cua rang me, Tôm càng nướng phô mai', r: 4.9, rev: 810, desc: 'Thiên đường hải sản tươi sống bắt tại bể kính cân tại chỗ, ghẹ xanh chắc nịch ngọt lịm chấm muối ớt xanh thơm nồng.' }
];

// Tạo 10 - 12 món ăn chuẩn vị cho từng quán từ 11 đến 100
for (const spec of remainingSpecs) {
  const dishes = makeDishes(
    [
      { cat: 'Món chính', name: `${spec.cui.split(',')[0]} Chuẩn Vị`, price: Math.floor(Math.random() * 4 + 4) * 10000 + 5000, desc: `${spec.desc} Nguyên liệu tươi ngon tẩm ướp đậm đà chuẩn vị truyền thống.`, tags: `${spec.cui.toLowerCase()}, tươi ngon, đậm đà`, calo: Math.floor(Math.random() * 200 + 450), p: 32, c: 65, f: 16 },
      { cat: 'Món chính', name: `${spec.cui.split(',')[0]} Thập Cẩm Đầy Đủ`, price: Math.floor(Math.random() * 4 + 5) * 10000, desc: 'Suất thập cẩm đầy đặn nhiều thịt topping ăn no nê sảng khoái.', tags: 'thập cẩm, đầy đủ, no nê', calo: Math.floor(Math.random() * 200 + 550), p: 38, c: 68, f: 20 },
      { cat: 'Món chính', name: `${spec.cui.split(',')[1] ? spec.cui.split(',')[1].trim() : 'Món Ngon'} Hương Vị Độc Đáo`, price: Math.floor(Math.random() * 3 + 4) * 10000 + 5000, desc: 'Hương vị chế biến kỳ công với nước sốt độc quyền làm bùng nổ vị giác.', tags: 'đặc sắc, sốt độc quyền, thơm ngon', calo: Math.floor(Math.random() * 150 + 480), p: 30, c: 60, f: 15 },
      { cat: 'Món chính', name: `${spec.cui.split(',')[0]} Suất Nhỏ Thanh Nhẹ`, price: Math.floor(Math.random() * 2 + 3) * 10000 + 5000, desc: 'Suất vừa vặn cho người ăn thanh đạm hoặc trẻ nhỏ.', tags: 'suất nhỏ, thanh nhẹ, vừa vặn', calo: 380, p: 22, c: 50, f: 10 },
      { cat: 'Món chính', name: `${spec.name.split(' ')[0]} ${spec.name.split(' ')[1]} Thượng Hạng`, price: Math.floor(Math.random() * 5 + 7) * 10000, desc: 'Phiên bản cao cấp với nguyên liệu tươi tuyển chọn loại một ngọt thơm.', tags: 'thượng hạng, tuyển chọn, thơm ngon', calo: 620, p: 42, c: 66, f: 18 },
    ],
    { cat: 'Món chính', name: `${spec.name} - Món Tủ Đặc Biệt`, price: Math.floor(Math.random() * 4 + 6) * 10000 + 5000, desc: `Món tủ làm nên tên tuổi của quán: ${spec.desc}`, tags: `${spec.cui.toLowerCase()}, signature, món tủ, best-seller`, calo: 680, p: 44, c: 72, f: 22 },
    [
      { cat: 'Đồ uống', name: 'Trà Tắc Hạt Chia Đá Lạnh', price: 15000, desc: 'Trà tắc tươi vắt mát lạnh giải nhiệt.', tags: 'trà tắc, hạt chia, giải nhiệt', calo: 80, p: 0, c: 20, f: 0 },
      { cat: 'Đồ uống', name: 'Trà Đào Cam Sả Thơm Mát', price: 25000, desc: 'Trà lài đào ngâm giòn thơm nức mùi sả tươi.', tags: 'trà đào, cam sả', calo: 120, p: 1, c: 28, f: 0 },
      { cat: 'Đồ uống', name: 'Sữa Đậu Nành Lá Dứa', price: 15000, desc: 'Sữa đậu nấu lá dứa thơm bùi ít ngọt.', tags: 'sữa đậu nành', calo: 110, p: 5, c: 16, f: 2 },
    ],
    [
      { cat: 'Ăn kèm', name: 'Đĩa Rau Sống Tươi Rối Bổ Sung', price: 10000, desc: 'Rau tươi các loại rửa sạch khử khuẩn.', tags: 'rau sống', calo: 30, p: 1, c: 6, f: 0 },
      { cat: 'Ăn kèm', name: 'Phần Topping Thịt Thêm Đầy Đặn', price: 25000, desc: 'Thêm nhiều thịt tươi mềm mọng nước.', tags: 'topping thêm', calo: 180, p: 18, c: 2, f: 10 },
    ],
    [
      { cat: 'Tráng miệng', name: 'Caramen Thạch Dừa Mát Lạnh', price: 15000, desc: 'Bánh caramen núng nính ăn cùng thạch dừa giòn.', tags: 'caramen, thạch dừa', calo: 160, p: 4, c: 24, f: 5 },
    ]
  );

  addRest(spec.id, spec.name, spec.owner, spec.phone, spec.email, spec.addr, spec.map, spec.d, spec.c, spec.lat, spec.lng, spec.cui, spec.r, spec.rev, spec.desc, '08:00 - 22:00', dishes);
}

// Chuyển đổi thành dạng phẳng (flatten) cho Excel
function flattenToExcelRows(restaurants) {
  const rows = [];

  for (const r of restaurants) {
    const info = r.info;
    const foods = r.foods;

    for (let i = 0; i < foods.length; i++) {
      const f = foods[i];
      const isFirst = i === 0;

      rows.push({
        email_chu_quan: isFirst ? info.email : '',
        mat_khau_chu_quan: isFirst ? info.pass : '',
        ten_chu_quan: isFirst ? info.owner : '',
        sdt_chu_quan: isFirst ? info.ownerPhone : '',
        ten_quan: info.name,
        dia_chi_quan: isFirst ? info.address : '',
        link_dia_chi_quan: isFirst ? info.mapUrl : '',
        quan_huyen: isFirst ? info.district : '',
        thanh_pho: isFirst ? info.city : '',
        vi_do_lat: isFirst ? info.lat : '',
        kinh_do_lng: isFirst ? info.lng : '',
        loai_am_thuc: isFirst ? info.cuisines : '',
        danh_gia_sao: isFirst ? info.rating : '',
        so_luong_danh_gia: isFirst ? info.reviews : '',
        mo_ta_quan: isFirst ? info.desc : '',
        gio_mo_cua: isFirst ? info.hours : '',
        sdt_quan: isFirst ? info.phone : '',
        link_logo_quan: isFirst ? info.logo : '',
        link_anh_bia_quan: isFirst ? info.cover : '',
        nhom_thuc_don: f.group,
        danh_muc: f.cat,
        ten_mon: f.name,
        gia_tien: f.price,
        mo_ta_mon: f.desc,
        link_anh_mon: '', // ĐỂ TRỐNG ĐỂ NGƯỜI DÙNG TỰ ĐIỀN LINK SAU
        the_tags: f.tags,
        calo: f.calo,
        protein: f.p,
        carbs: f.c,
        fat: f.f,
        luot_dat: f.order,
        luot_thich: f.like,
        mon_noi_bat: f.hot,
      });
    }
  }

  return rows;
}

// Tự động căn chỉnh độ rộng cột
function calculateColumnWidths(data, customMaxCaps = {}) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);

  return keys.map((key) => {
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

function generateExcel() {
  console.log(`Đang tổng hợp dữ liệu cho ${allRestaurants.length} nhà hàng...`);
  const rows = flattenToExcelRows(allRestaurants);
  console.log(`Tổng cộng: ${rows.length} món ăn chi tiết (Trung bình ~11 món/quán).`);

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = calculateColumnWidths(rows, {
    link_dia_chi_quan: 45,
    link_logo_quan: 32,
    link_anh_bia_quan: 32,
    link_anh_mon: 25,
    mo_ta_quan: 52,
    mo_ta_mon: 55,
    dia_chi_quan: 45,
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nhà Hàng & Món Ăn');
  const outFile = path.join(dataDir, 'nha_hang_va_mon_an.xlsx');

  try {
    XLSX.writeFile(wb, outFile);
    console.log(`\n🎉 ĐÃ XUẤT XONG 100 NHÀ HÀNG & ${rows.length} MÓN ĂN VÀO FILE:`);
    console.log(`👉 ${outFile}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackFile = path.join(dataDir, 'nha_hang_va_mon_an_100_quan.xlsx');
      XLSX.writeFile(wb, fallbackFile);
      console.log(`⚠️ File ${outFile} đang được mở trong Excel.`);
      console.log(`✅ ĐÃ TỰ ĐỘNG XUẤT RA FILE MỚI ĐỂ BẠN XEM NGAY:`);
      console.log(`👉 ${fallbackFile}`);
    } else {
      console.error(`❌ Lỗi ghi file: ${err.message}`);
    }
  }
}

// Xuất module để có thể chạy trực tiếp hoặc import
if (require.main === module) {
  generateExcel();
}

module.exports = {
  allRestaurants,
  generateExcel,
};
