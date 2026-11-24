const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Load specs from generate-100-restaurants.js
const genContent = fs.readFileSync(path.join(__dirname, 'generate-100-restaurants.js'), 'utf8');
const match = genContent.match(/const remainingSpecs = \[([\s\S]*?)\];/);
if (!match) {
  console.error('Cannot find remainingSpecs in generate-100-restaurants.js');
  process.exit(1);
}
const specs = eval('[' + match[1] + ']');
console.log(`Loaded ${specs.length} specs from generate-100-restaurants.js`);

/**
 * Builds authentic 12 dishes for a restaurant spec based on its domain.
 */
function buildDishesForSpec(spec) {
  const name = spec.name;
  const cuiList = (spec.cui || '').split(',').map(s => s.trim());
  const cui1 = cuiList[0] || spec.name;
  const cui2 = cuiList[1] || cui1;
  const cui3 = cuiList[2] || cui2;
  const desc = spec.desc;

  const nLower = name.toLowerCase();
  const cLower = spec.cui.toLowerCase();
  const allLower = `${nLower} ${cLower} ${desc.toLowerCase()}`;

  // 1. BEVERAGE & COFFEE & TEA (Highlands, Cộng, Phúc Long, Gong Cha, Toco, Koi, The Alley, Kafa, Trà sữa nướng)
  if (allLower.includes('trà sữa') || allLower.includes('cà phê') || allLower.includes('coffee') || allLower.includes('kafa')) {
    let sigName = `${cui1} Đặc Biệt`;
    let main2 = `${cui2} Thơm Béo`;
    let main3 = `${cui3} Tươi Mát`;
    let main4 = `Trà Sữa Trân Châu Hoàng Kim Đậm Vị`;
    let main5 = `Trà Trái Cây Nhiệt Đới Thanh Mát`;
    let premium = `${name} Thượng Hạng Cốt Đậm`;

    if (nLower.includes('phúc long')) {
      sigName = 'Trà Ô Long Sữa Phúc Long Đậm Vị';
      main2 = 'Trà Đào Cam Sả Tươi Giòn Ngọt';
      main3 = 'Trà Vải Lài Thơm Mát Thanh Tao';
      main4 = 'Hồng Trà Sữa Trân Châu Đen Thơm Béo';
      main5 = 'Trà Xanh Latte Hạnh Nhân';
      premium = 'Cà Phê Phin Phúc Long Đậm Đà Sữa Đặc';
    } else if (nLower.includes('cộng')) {
      sigName = 'Cà Phê Cốt Dừa Đá Xay Hà Thành';
      main2 = 'Cà Phê Trứng Béo Ngậy Đánh Bông';
      main3 = 'Bạc Xỉu Ba Tầng Nắng Mai';
      main4 = 'Trà Tắc Xí Muội Hà Nội Cổ';
      main5 = 'Sữa Chua Đánh Đá Cà Phê Mát Lạnh';
      premium = 'Cà Phê Đen Phin Rang Mộc Đậm Vị';
    } else if (nLower.includes('gong') || nLower.includes('koi') || nLower.includes('toco') || nLower.includes('alley')) {
      sigName = `${cui1} Macchiato Kem Sữa Sánh Mịn`;
      main2 = `${cui2} Dẻo Dai Thơm Ngọt Đường Đen`;
      main3 = 'Trà Xanh Nhài Sữa Tươi Thanh Nhẹ';
      main4 = 'Trà Oolong Nướng Trân Châu Hoàng Kim';
      main5 = 'Sữa Tươi Trân Châu Đường Đen Nấu Dẻo';
      premium = 'Trà Sữa Khoai Môn Sữa Tươi Béo Bùi';
    } else if (nLower.includes('highland')) {
      sigName = 'Trà Sen Vàng Củ Năng Giòn Ngọt Trứ Danh';
      main2 = 'Phin Sữa Đá Đậm Vị Truyền Thống';
      main3 = 'Freeze Trà Xanh Thạch Matcha Béo Ngậy';
      main4 = 'Trà Thanh Đào Giòn Ngọt Thanh Mát';
      main5 = 'Cà Phê Phin Đen Đá Đậm Gu';
      premium = 'Freeze Cà Phê Phin Caramel Kem Béo';
    } else if (nLower.includes('vân nam')) {
      sigName = 'Trà Sữa Nướng Than Hoa Hũ Đất Vân Nam';
      main2 = 'Trà Phổ Nhĩ Quýt Rừng Hũ Đất Nóng';
      main3 = 'Trà Thảo Mộc Táo Đỏ Kỷ Tử Dưỡng Nhan';
      main4 = 'Trà Sữa Hoa Hồng Vân Nam Hũ Đất Nung';
      main5 = 'Trà Ô Long Rang Gạo Thơm Lừng Hũ Gốm';
      premium = 'Trà Sữa Nướng Bát Bảo Cung Đình Thượng Hạng';
    }

    return [
      { name: sigName, desc: `${desc} Hương vị pha chế kỳ công, lớp kem béo mặn sánh mịn quyện cùng trà đậm thanh mát.` },
      { name: main2, desc: 'Pha chế từ lá trà tươi tuyển chọn hoặc cốt cà phê đậm vị, thơm lừng ngọt dịu sảng khoái.' },
      { name: main3, desc: 'Trái cây tự nhiên kết hợp nền trà thanh khiết, thơm nức mùi hoa quả tươi và thanh nhiệt tức thì.' },
      { name: main4, desc: 'Hương vị béo ngậy ngọt ngào của sữa tươi kết hợp trân châu dẻo giòn, thơm đượm vị caramel.' },
      { name: main5, desc: 'Thức uống thanh tao giải nhiệt, hàm lượng calo nhẹ nhàng tươi mát cho ngày dài năng động.' },
      { name: premium, desc: 'Tuyển chọn từ những nguyên liệu hảo hạng nhất, hương vị đậm đà khó quên làm say đắm tín đồ ẩm thực.' },
      { name: 'Topping Trân Châu Trắng Giòn Dai', desc: 'Hạt trân châu 3Q giòn sần sật nhai vui miệng ngâm nước đường phèn thanh ngọt.' },
      { name: 'Topping Kem Cheese Milkfoam Béo Mặn', desc: 'Lớp kem béo sánh mịn hơi mằn mặn ngậy thơm phủ trên mặt ly trà tạo điểm nhấn khó quên.' },
      { name: 'Bánh Croissant Bơ Tỏi Nướng Giòn', desc: 'Bánh sừng bò ngàn lớp thơm lừng bơ Pháp nướng giòn rụm bên ngoài xốp mềm bên trong ăn kèm đồ uống.' },
      { name: 'Bánh Tiramisu Phô Mai Cà Phê', desc: 'Bánh kem phô mai Mascarpone đắng nhẹ bột cacao quyện hương cà phê nồng nàn dịu êm.' },
      { name: 'Trà Chanh Mật Ong Gừng Ấm Áp', desc: 'Nước trà xanh pha cốt chanh tươi, mật ong hoa rừng và gừng tươi ấm bụng thanh giọng.' },
      { name: 'Bánh Flan Trà Xanh Cốt Dừa Mát Lạnh', desc: 'Caramen trà xanh mềm mướt béo ngậy rưới nước cốt dừa và cà phê đá thơm bùi.' }
    ];
  }

  // 2. DESSERT & SWEETS (Chè Cung Đình, Chè Mâm, Tàu Hũ, Chè Bưởi)
  if (allLower.includes('chè') || allLower.includes('tàu hũ')) {
    return [
      { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Hương vị ngọt thanh bùi béo nấu thủ công từ nguyên liệu tự nhiên không gắt đường.` },
      { name: `${cui1} Chuẩn Vị`, desc: 'Nguyên liệu ninh nhừ dẻo quánh, nước cốt dừa béo ngậy thơm nức mũi chuẩn hương vị truyền thống.' },
      { name: `${cui2} Nước Cốt Dừa Béo Ngậy`, desc: 'Hương thơm ngọt ngào từ đường thốt nốt và nước cốt dừa tươi thơm bùi ngập tràn topping.' },
      { name: 'Chè Khúc Bạch Phô Mai Hạnh Nhân', desc: 'Những viên khúc bạch phô mai mềm dẻo mát rượi ăn cùng nhãn ngọt giòn và hạnh nhân lát rang vàng.' },
      { name: 'Chè Bưởi An Giang Giòn Sần Sật', desc: 'Cùi bưởi sơ chế kỹ giòn sần sật không chút vị đắng kết hợp đỗ xanh ninh mềm béo bùi.' },
      { name: 'Mâm Chè Thập Cẩm Cố Đô Thượng Hạng', desc: 'Mâm chè hội tụ đầy đủ hương vị cung đình từ hạt sen, long nhãn, đậu đỏ và nước cốt dừa béo bùi.' },
      { name: 'Topping Thạch Dừa Non Bến Tre Giòn Ngọt', desc: 'Thạch dừa tự nhiên giòn sần sật ngọt thanh mát lành ăn kèm các món chè ngọt mát.' },
      { name: 'Topping Sầu Riêng Tươi Ri6 Dằm Nhuyễn', desc: 'Cơm sầu riêng chín cây béo ngậy thơm nức mũi xúc cùng đá lạnh và nước cốt dừa.' },
      { name: 'Chén Nước Cốt Dừa Thắng Đậm Đặc Thêm', desc: 'Nước cốt dừa tươi thắng thủ công với chút muối và lá dứa béo bùi sánh đặc thơm ngậy.' },
      { name: 'Topping Hạt Sen Đồng Tháp Ninh Bở Bùi', desc: 'Hạt sen tươi ninh bở tơi bùi ngọt thanh mát bổ dưỡng an thần mát gan.' },
      { name: 'Nước Mía Lau Rễ Tranh Thanh Nhiệt', desc: 'Nước nấu từ mía lau, rễ tranh và bắp ngọt giải nhiệt thanh mát cơ thể.' },
      { name: 'Sữa Chua Nếp Cẩm Mộc Châu Dẻo Thơm', desc: 'Sữa chua lên men tự nhiên chua dịu ăn cùng hạt nếp cẩm dẻo thơm bùi bùi.' }
    ];
  }

  // 3. VEGAN (Cơm Chay Ưu Đàm, Chay Tâm Đức)
  if (allLower.includes('chay')) {
    return [
      { name: `${spec.name} - Mâm Cỗ Chay Thanh Tịnh`, desc: `${desc} Nguyên liệu rau củ hữu cơ và nấm tự nhiên bổ dưỡng thanh lọc thân tâm thuần khiết.` },
      { name: `${cui1} Thuần Chay Chuẩn Vị`, desc: 'Món chay chế biến kỳ công giữ trọn vị ngọt tự nhiên từ rau củ quả tươi sạch.' },
      { name: `${cui2} Thanh Đạm Bổ Dưỡng`, desc: 'Hương vị mộc mạc thơm thoang thoảng mùi thảo mộc, giàu chất xơ và đạm thực vật lành mạnh.' },
      { name: 'Nấm Đùi Gà Áp Chảo Sốt Tiêu Đen Chay', desc: 'Nấm đùi gà dày thịt dai ngọt áp chảo sốt tiêu đen Phú Quốc thơm nồng đậm đà.' },
      { name: 'Đậu Hũ Non Sốt Nấm Đông Cô Tứ Xuyên', desc: 'Đậu hũ non mềm mịn tan trong miệng nấu cùng nấm đông cô tươi và sốt cay nhẹ ấm bụng.' },
      { name: 'Lẩu Nấm Hoàng Kim Thuần Chay Thượng Hạng', desc: 'Nước lẩu nấu từ lê ngọt, bắp và nấm quý thanh tao nhúng rau rừng xanh mướt.' },
      { name: 'Đĩa Rau Rừng & Nấm Thiên Nhiên Nhúng Kèm', desc: 'Rau rừng sạch, cải thìa non và các loại nấm tươi giàu vitamin và khoáng chất tự nhiên.' },
      { name: 'Topping Chả Lụa Nấm & Đậu Hũ Chiên Giòn Thuần Chay', desc: 'Chả lụa làm từ nấm hương đạm thực vật và đậu hũ non chiên giòn rụm bổ sung đạm lành mạnh.' },
      { name: 'Trà Sen Tây Hồ Thanh Khiết An Yên', desc: 'Trà búp ướp nhụy sen Bách Diệp Tây Hồ thơm thanh tao giúp tĩnh tâm thư thái.' },
      { name: 'Nước Ép Táo Cà Rốt Tươi Thanh Lọc Cơ Thể', desc: 'Nước ép nguyên chất từ táo giòn và cà rốt tươi bổ sung vitamin A và chất chống oxy hóa.' },
      { name: 'Sữa Hạt Óc Chó Mè Đen Bổ Dưỡng', desc: 'Sữa hạt thuần chay nấu từ hạt óc chó, mè đen và đậu đỏ béo ngậy ít ngọt.' },
      { name: 'Chè Hạt Sen Long Nhãn Đường Phèn', desc: 'Hạt sen bở bùi lồng trong cùi nhãn ngọt giòn chan nước đường phèn thanh nhẹ.' }
    ];
  }

  // 4. HEALTHY & SALAD & POKE (Bếp Xanh Healthy Salad & Poke)
  if (allLower.includes('salad') || allLower.includes('poke') || allLower.includes('healthy')) {
    return [
      { name: `${spec.name} - Bát Ăn Dinh Dưỡng Toàn Diện`, desc: `${desc} Cân bằng hoàn hảo giữa protein nạc, chất béo tốt và rau củ tươi hữu cơ giàu vi chất.` },
      { name: `${cui1} Sốt Mè Rang Tươi Ngon`, desc: 'Nguyên liệu sạch chuẩn VietGAP, kết hợp sốt mè rang béo thơm đậm đà kích thích vị giác.' },
      { name: `${cui2} Ít Tinh Bột Giàu Đạm`, desc: 'Món ăn tính toán chuẩn calo, giàu protein nạc giúp phát triển cơ bắp và duy trì vóc dáng thon gọn.' },
      { name: 'Poke Bowl Cá Hồi Na Uy & Bơ Sáp', desc: 'Cá hồi Na Uy tươi béo thái hạt lựu ăn cùng bơ sáp, rong biển và cơm gạo lứt dẻo thơm.' },
      { name: 'Salad Ức Gà Nướng Thảo Mộc Sốt Chanh Leo', desc: 'Ức gà nướng mềm mọng nước không khô xơ trộn xà lách giòn và sốt chanh leo chua ngọt dịu.' },
      { name: 'Salad Bò Mỹ Áp Chảo Sốt Dầu Giấm Olive', desc: 'Thịt bò Mỹ áp chảo mềm ngọt kết hợp cà chua bi, xà lách xoăn và dầu ô liu nguyên chất.' },
      { name: 'Đĩa Rau Rocket & Xà Lách Xoăn Hữu Cơ Thêm', desc: 'Rau xà lách Romaine, rocket giòn cay nhẹ trồng thủy canh bổ sung chất xơ tươi mới.' },
      { name: 'Topping Trứng Chần Lòng Đào & Hạt Quinoa Bổ Sung', desc: 'Trứng gà ta lòng đào béo ngậy kèm hạt diêm mạch Quinoa giàu protein thực vật siêu bổ dưỡng.' },
      { name: 'Nước Ép Cần Tây Táo Xanh Detox Giảm Mỡ', desc: 'Nước ép ép chậm giữ trọn vẹn enzyme thải độc và thanh lọc vóc dáng hiệu quả.' },
      { name: 'Sinh Tố Bơ Chuối Sữa Hạt Hạnh Nhân', desc: 'Bơ sáp dẻo quậy cùng chuối chín và sữa hạt bùi béo không đường tinh luyện.' },
      { name: 'Trà Kombucha Hoa Quả Nhiệt Đới Lên Men', desc: 'Trà lên men giàu lợi khuẩn men sống hỗ trợ tiêu hóa và tăng cường đề kháng.' },
      { name: 'Bánh Yến Mạch Nướng Chuối Hạt Chia Ít Calo', desc: 'Bánh nướng từ yến mạch nguyên cám và chuối tươi không đường ngọt tự nhiên.' }
    ];
  }

  // 5. PIZZA, BURGER, GÀ RÁN, PHÁP, KEBAB (Domino, Pizza 4Pi, Pizza Company, Popeye, Lotteria, Jollibee, Le Ciel, Kebab)
  if (allLower.includes('pizza') || allLower.includes('gà rán') || allLower.includes('burger') || allLower.includes('popeye') || allLower.includes('lotteria') || allLower.includes('jollibee') || allLower.includes('le ciel') || allLower.includes('kebab')) {
    return [
      { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Nướng vàng giòn rụm với công thức ướp bí truyền chuẩn phong vị Âu Mỹ hiện đại.` },
      { name: `${cui1} Nướng Giòn Chuẩn Vị`, desc: 'Lớp vỏ vàng ruộm thơm lừng, nhân thịt ngập tràn phô mai béo ngậy đậm đà khó cưỡng.' },
      { name: `${cui2} Sốt Đậm Đà Tan Chảy`, desc: 'Hương vị sốt độc quyền phủ đều miếng thịt mọng nước, hòa quyện phô mai kéo sợi thơm ngậy.' },
      { name: 'Mì Ý Spaghetti Sốt Bò Bằm Phô Mai', desc: 'Sợi mì Ý luộc vừa chín tới ngập tràn sốt thịt bò bằm cà chua thơm thảo mộc và phô mai bào.' },
      { name: 'Burger Bò Nướng Phô Mai Cheddar Béo Ngậy', desc: 'Bánh mì mè kẹp thịt bò nướng than hoa mềm mọng, phô mai Cheddar tan chảy và rau củ tươi.' },
      { name: 'Pizza / Gà Rán Thập Cẩm Thượng Hạng', desc: 'Phiên bản cao cấp với nguyên liệu tươi tuyển chọn loại một ngập tràn topping thơm ngon.' },
      { name: 'Salad Caesar Xốt Phô Mai Parmigiano Giòn Rụm', desc: 'Xà lách Roman tươi giòn trộn sốt Caesar phô mai Parmesan và bánh mì sấy giòn rụm.' },
      { name: 'Khoai Tây Múi Cau Chiên Giòn Lắc Phô Mai', desc: 'Khoai tây tươi cắt múi cau chiên vàng ruộm rắc phô mai Cheddar béo mặn thơm nức mũi.' },
      { name: 'Coca-Cola Ướp Lạnh Sảng Khoái', desc: 'Nước ngọt có gas mát lạnh uống kèm đồ nướng rán xua tan cảm giác ngấy tức thì.' },
      { name: 'Sprite Chanh Tươi Mát Lạnh Đá Viên', desc: 'Nước giải khát vị chanh tươi mát lạnh sảng khoái kích thích vị giác.' },
      { name: 'Súp Bí Đỏ Nướng Kem Tươi Bơ Pháp', desc: 'Bí đỏ nướng xay nhuyễn mịn nấu cùng kem béo và bơ Pháp thơm lừng ấm áp.' },
      { name: 'Bánh Tart Phô Mai Nướng Lò Xốp Giòn', desc: 'Đế bánh tart bơ xốp giòn nhân phô mai nướng vàng xém chảy béo ngậy ngọt dịu.' }
    ];
  }

  // 6. JAPANESE & SUSHI & OMAKASE (Cá Chép Koi, Tokyo Deli, Ba Con Sóc, Sato Omakase)
  if (allLower.includes('sushi') || allLower.includes('omakase') || allLower.includes('tokyo deli')) {
    return [
      { name: `${spec.name} - Set Omakase Tinh Tuyển`, desc: `${desc} Hải sản tươi sống nhập khẩu trực tiếp thái lát điêu luyện giữ trọn vị ngọt tự nhiên đại dương.` },
      { name: `${cui1} Tươi Ngọt Chuẩn Vị`, desc: 'Miếng cá thái dày đều tay, thịt săn chắc ngọt lịm chấm cùng nước tương Nhật và wasabi cay nồng.' },
      { name: `${cui2} Trứng Muối Bùi Béo`, desc: 'Cơm trộn giấm gạo dẻo mềm ôm trọn hải sản tươi sống rắc trứng cua giòn sần sật.' },
      { name: 'Cơm Cuộn Bơ California Roll Trứng Cua', desc: 'Cơm cuộn bơ sáp béo ngậy, thanh cua giòn ngọt phủ kín trứng cá chuồn đỏ cam óng ả.' },
      { name: 'Cơm Lươn Nướng Sốt Kabayaki Nhật Bản', desc: 'Lươn Nhật nướng than hoa phết sốt ngọt đậm đà óng ánh đặt trên bát cơm dẻo nóng hổi.' },
      { name: 'Thuyền Sushi & Sashimi Thượng Hạng', desc: 'Thuyền gỗ sang trọng ngập tràn cá hồi, cá ngừ Otoro, bạch tuộc và sò đỏ tươi rói.' },
      { name: 'Salad Rong Biển Mè Rang Goma Wakame', desc: 'Sợi rong biển xanh giòn sần sật trộn mè rang thơm lừng và sốt chua ngọt Nhật Bản.' },
      { name: 'Súp Miso Rong Biển Đậu Hũ Non Ấm Nóng', desc: 'Tô súp tương đậu Miso truyền thống ninh từ cá ngừ bào và rong biển kèm đậu hũ non thanh nhẹ.' },
      { name: 'Trứng Hấp Chawanmushi Mịn Mượt', desc: 'Trứng gà ta đánh mịn hấp cách thủy cùng tôm nõn và nấm hương mềm tan như bánh pudding.' },
      { name: 'Trà Gạo Lứt Rang Genmaicha Nhật Bản', desc: 'Trà xanh thượng hạng pha gạo lứt rang thơm ngát ấm bụng dịu êm.' },
      { name: 'Rượu Mơ Nhật Bản Umeshu Mát Lạnh', desc: 'Rượu mơ ủ truyền thống chua ngọt thơm dịu hương thảo mộc ướp lạnh.' },
      { name: 'Bánh Mochi Trà Xanh Nhân Đậu Đỏ', desc: 'Vỏ mochi dẻo mềm phủ bột matcha Nhật ôm trọn nhân đậu đỏ ngọt bùi thanh mát.' }
    ];
  }

  // 7. KOREAN BBQ & NƯỚNG & LẨU CAY (King BBQ, Gogi, Sumo, Meat & Meet, Mì Cay Sasim, Naga, Wagyu Prime)
  if (allLower.includes('gogi') || allLower.includes('bbq') || allLower.includes('mì cay') || allLower.includes('wagyu') || allLower.includes('yakiniku')) {
    const isMiCay = allLower.includes('mì cay');
    if (isMiCay) {
      return [
        { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Nước dùng chua cay đậm đà 7 cấp độ sôi sục trong thố đất ngập tràn topping tươi sống.` },
        { name: `${cui1} Đậm Đà Cay Nồng`, desc: 'Sợi mì Koreno dai vàng ngập trong nước súp kim chi hải sản chua cay thơm nức mũi.' },
        { name: `${cui2} Phô Mai Kéo Sợi`, desc: 'Bánh gạo dẻo mềm ngập trong nước sốt cay ngọt Hàn Quốc quyện phô mai Mozzarella béo ngậy.' },
        { name: 'Chả Cá Odeng Xiên Que Nước Súp Củ Cải', desc: 'Chả cá Hàn Quốc xiên que luộc trong nước súp ngọt thanh ninh từ củ cải và cá cơm khô.' },
        { name: 'Kimbap Chiên Xù Giòn Rụm Nhân Xúc Xích Trứng', desc: 'Cơm cuộn rong biển tẩm bột chiên xù giòn tan chấm sốt tương ớt mayonnaise béo ngậy.' },
        { name: 'Thố Mì Cay Thập Cẩm Bò Mỹ & Hải Sản Thượng Hạng', desc: 'Thố mì cay khổng lồ ngập tràn tôm sú, mực tươi, bò Mỹ cuộn nấm và xúc xích Đức.' },
        { name: 'Đĩa Kim Chi Cải Thảo & Rong Biển Ăn Kèm', desc: 'Kim chi giòn cay kết hợp rong biển khô ăn kèm mì cay chống ngấy hoàn hảo.' },
        { name: 'Đĩa Viên Thả Mì Cay & Nấm Kim Châm Bổ Sung', desc: 'Thêm tôm viên, cá viên, bò viên giòn dai và nấm kim châm tươi ngọt nước.' },
        { name: 'Trà Đào Cam Sả Đá Lạnh Giải Cay', desc: 'Trà lài đào ngâm thanh mát vị chua ngọt sảng khoái giúp làm dịu vị cay xè tức thì.' },
        { name: 'Trà Sữa Thái Xanh Thơm Nồng Mát Rượi', desc: 'Trà thái xanh ngát béo ngậy sữa đặc ngọt thơm mát rượi xua tan cơn cay.' },
        { name: 'Nước Ép Dưa Hấu Đá Tuyết Mát Lạnh', desc: 'Dưa hấu tươi ép lạnh ngọt lịm xua tan cơn cay nồng bốc hỏa sảng khoái.' },
        { name: 'Bánh Cá Bungeoppang Nhân Đậu Đỏ Nóng Hổi', desc: 'Bánh cá nướng giòn vỏ thơm bơ nhân đậu đỏ ngọt bùi hấp dẫn.' }
      ];
    } else {
      return [
        { name: `${spec.name} - Set Nướng Than Hoa Thượng Hạng`, desc: `${desc} Thịt bò tẩm ướp sốt trái cây tự nhiên nướng xèo xèo trên than hoa đỏ rực mọng nước ngọt mềm.` },
        { name: `${cui1} Nướng Mềm Mọng Nước`, desc: 'Miếng thịt nướng xém cạnh thơm nức mùi khói than hoa, chấm sốt đậu lên men chuẩn vị Hàn.' },
        { name: `${cui2} Cuộn Nấm Kim Châm`, desc: 'Thịt ba chỉ thái lát mỏng cuộn nấm kim châm ngọt giòn nướng thơm lừng béo ngậy.' },
        { name: 'Cơm Trộn Thố Đá Bibimbap Bò Băm Trứng Lòng Đào', desc: 'Cơm thố đá xèo xèo hạt giòn rụm trộn đều cùng rau củ, thịt bò và tương ớt Gochujang thơm lừng.' },
        { name: 'Canh Kim Chi Thịt Heo Hầm Đậu Hũ Non', desc: 'Canh kim chi chua cay ấm nóng ninh cùng thịt ba chỉ heo và đậu hũ non béo mềm.' },
        { name: 'Dẻ Sườn Bò Hoàng Đế Thượng Hạng', desc: 'Phần dẻ sườn cao cấp vân mỡ đều như hoa văn nướng chín tới mềm tan trong khoang miệng.' },
        { name: 'Xà Lách Tươi & Lá Kim Cuốn Thịt Nướng', desc: 'Rau xà lách sạch, lá vừng mè Hàn Quốc và lá kim giòn cuốn thịt nướng chấm sốt Ssamjang.' },
        { name: 'Kim Chi Cải Thảo Muối Giòn Cay Chuẩn Vị Hàn', desc: 'Cải thảo giòn sần sật lên men chua cay đậm vị ớt bột Gochugaru chống ngấy hoàn hảo.' },
        { name: 'Rượu Soju Vị Đào Mát Lạnh', desc: 'Rượu Soju Hàn Quốc hương đào ngọt nhẹ êm ái uống cùng thịt nướng cực kỳ hợp gu.' },
        { name: 'Nước Gạo Rang Woongjin Hàn Quốc', desc: 'Nước gạo rang thanh mát thơm bùi ngọt dịu giải cay khi ăn đồ nướng.' },
        { name: 'Canh Sườn Bò Hầm Củ Cải Nhân Sâm', desc: 'Nước súp ngọt đậm đà ninh từ sườn bò và củ cải thanh mát bổ dưỡng cơ thể.' },
        { name: 'Kem Bingsu Sữa Tuyết Phô Mai Béo Ngậy', desc: 'Tuyết sữa bào mịn như bông phủ phô mai béo ngậy và sốt dâu tây ngọt mát.' }
      ];
    }
  }

  // 8. LẨU (Hải Đế Lao, Manwah, Hutong, Lẩu Ba Toa, Lẩu Riêu Cua)
  if (allLower.includes('lẩu') || allLower.includes('hải đế lao') || allLower.includes('manwah') || allLower.includes('hutong')) {
    return [
      { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Nước lẩu ninh hầm hơn 12 tiếng từ xương tủy và thảo mộc thơm lừng ngọt đậm đà tự nhiên.` },
      { name: `${cui1} Nước Dùng Chuẩn Vị`, desc: 'Nồi lẩu sôi sục ngập tràn gạch cua / thảo quả cay tê, hương vị lan tỏa khắp bàn ăn.' },
      { name: `${cui2} Nhúng Tươi Ngon`, desc: 'Thịt tươi thái mỏng nhúng tái ngọt lịm chấm cùng gia vị pha chế riêng của quán.' },
      { name: 'Há Cảo Tôm Thịt & Viên Thả Lẩu Phô Mai Trứng Muối', desc: 'Viên thả lẩu cao cấp cắn ngập miệng nhân phô mai trứng muối béo ngậy tan chảy.' },
      { name: 'Mì Tươi Kéo Sợi Thủ Công Nhúng Lẩu', desc: 'Sợi mì tươi dẻo mềm óng ả nhúng nước lẩu sôi sục ngấm đượm vị ngọt xương hầm.' },
      { name: 'Mẹt Bò & Hải Sản Nhúng Lẩu Thượng Hạng', desc: 'Đĩa thịt tổng hợp gồm bắp bò hoa, ba chỉ bò Mỹ và tôm sú tươi rói đầy đặn.' },
      { name: 'Đĩa Nấm Tươi Thập Cẩm & Rau Nhúng Lẩu Xanh Non', desc: 'Nấm kim châm, nấm đùi gà, nấm hoàng kim kèm rau cải non xanh sạch ăn kèm nước lẩu.' },
      { name: 'Đĩa Ba Chỉ Bò Mỹ Nhúng Lẩu Thêm Đầy Đặn', desc: 'Thịt ba chỉ bò Mỹ thái lát cuộn tròn đỏ tươi béo ngậy nhúng lẩu sôi sục bổ sung.' },
      { name: 'Trà Mận Xí Muội Mát Lạnh Giải Dầu Mỡ', desc: 'Nước mận ngâm xí muội chua thanh mằn mặn uống kèm lẩu cay cực kỳ sảng khoái giải ngấy.' },
      { name: 'Trà Bí Đao Hạt Chia Thanh Nhiệt', desc: 'Trà bí đao nấu lá dứa ngọt thanh kết hợp hạt chia mát gan giải nhiệt ngày hè.' },
      { name: 'Sữa Đậu Nành Tươi Nấu Lá Dứa Ấm Bụng', desc: 'Sữa đậu nguyên chất thơm bùi lá dứa làm dịu êm dạ dày sau bữa lẩu đậm đà.' },
      { name: 'Chè Tàu Hũ Hạnh Nhân Nước Đường Phèn', desc: 'Đậu hũ hạnh nhân mềm mịn tan trong miệng thoang thoảng mùi sữa béo ngọt dịu.' }
    ];
  }

  // 9. CHINESE & DIMSUM (Dimsum Xửng Tre, San Fu Lou, Meiwei)
  if (allLower.includes('dimsum') || allLower.includes('san fu lou') || allLower.includes('meiwei')) {
    return [
      { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Nghệ thuật xửng tre hấp cách thủy giữ trọn hương vị tươi ngọt tinh khiết của tôm thịt.` },
      { name: `${cui1} Vỏ Mỏng Trong Suốt Chuẩn Vị`, desc: 'Lớp vỏ bánh trong vắt nhìn thấu nhân tôm đỏ au giòn sần sật ngọt lịm chấm tương ớt giấm đỏ.' },
      { name: `${cui2} Trứng Muối Béo Ngậy`, desc: 'Hương vị thơm nức mũi, nhân trứng muối hoàng kim chảy sánh mịn béo bùi ngất ngây.' },
      { name: 'Chân Gà Hấp Tàu Xì Mềm Rục Đậm Đà', desc: 'Chân gà om tàu xì gia vị thảo mộc Trung Hoa da mềm béo ngậy róc xương đậm đà cay nhẹ.' },
      { name: 'Bánh Cuốn Tôm Tươi Tráng Mỏng Rưới Tương Ngọt', desc: 'Bánh cuốn bột gạo mướt mềm ôm trọn con tôm sông tươi ngọt chan nước tương pha ngọt thanh.' },
      { name: 'Vịt Quay Quảng Đông Da Giòn Óng Ả Thượng Hạng', desc: 'Vịt quay móc mật da mỏng tang giòn rụm thịt mềm ngọt chấm nước sốt mận chua ngọt.' },
      { name: 'Cải Thìa Xào Tỏi Dầu Hào Thơm Giòn', desc: 'Cải thìa non xanh mướt xào lửa lớn cùng tỏi phi và dầu hào hảo hạng thơm phức.' },
      { name: 'Xửng Xíu Mại Tôm Thịt Trứng Cua Hấp Thêm (3 viên)', desc: 'Viên xíu mại đẫy thịt tôm tươi giòn dai phủ trứng cua đỏ cam hấp nóng hổi trong xửng tre.' },
      { name: 'Trà Ô Long Thiết Quan Âm Ấm Nóng', desc: 'Trà Thiết Quan Âm hương lan ngọt hậu giúp tiêu hóa và tẩy dầu mỡ sau bữa dimsum.' },
      { name: 'Trà Hoa Cúc Kỷ Tử Mật Ong Thanh Lọc', desc: 'Trà thảo mộc thơm dịu giúp sáng mắt mát gan thanh lọc cơ thể nhẹ nhõm.' },
      { name: 'Nước Mía Hấp Cốt Gừng Ấm Bụng', desc: 'Nước mía ngọt dịu hấp cùng lát gừng tươi thanh họng ấm dạ dày.' },
      { name: 'Bánh Bao Nhím Chiên Giòn Nhân Sữa Dừa', desc: 'Bánh bao tạo hình chú nhím xinh xắn chiên vàng giòn vỏ nhân sữa dừa thơm béo.' }
    ];
  }

  // 10. SEAFOOD & ỐC (Hải Sản Biển Đông, Hải Sản Hoàng Gia, Ốc Đào, Ốc Cay)
  if (allLower.includes('ốc') || allLower.includes('hải sản') || allLower.includes('cua ghẹ') || allLower.includes('king crab') || spec.id === 100) {
    return [
      { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Hải sản tươi sống bắt tại bể kính cân tại chỗ, thịt ngọt lịm chắc nịch chấm muối ớt xanh.` },
      { name: `${cui1} Chuẩn Vị Tươi Sống`, desc: 'Chế biến nóng hổi ngay khi khách gọi, giữ trọn vị ngọt tự nhiên của biển cả thơm lừng mùi sả ớt.' },
      { name: `${cui2} Sốt Đậm Đà Cay Ngọt`, desc: 'Nước sốt độc quyền sánh đặc áo đều từng con ốc / càng cua, thơm bơ tỏi và trứng muối béo ngậy.' },
      { name: 'Ốc Móng Tay Xào Rau Muống Tỏi Giòn', desc: 'Ốc móng tay béo tròn xào cùng rau muống xanh non lửa lớn thơm nức mùi tỏi phi giòn.' },
      { name: 'Ngao Hoa Hai Cùi Hấp Sả Ớt Cay Ấm', desc: 'Ngao hoa ngọt lịm hấp sả cây và ớt hiểm cay nồng, nước hấp ngọt đậm đà húp xì xụp ấm bụng.' },
      { name: 'Mâm Hải Sản Nướng Mỡ Hành Thượng Hạng', desc: 'Mâm nướng tổng hợp sò điệp, hàu sữa và tôm sú nướng mỡ hành đậu phộng thơm phức.' },
      { name: 'Đĩa Rau Răm & Muối Tiêu Chanh Tươi Chấm Hải Sản', desc: 'Rau răm non tươi cay nồng kết hợp muối tiêu chanh ớt gió tôn vinh vị ngọt hải sản.' },
      { name: 'Bánh Mì Nướng Bơ Giòn Tan Chấm Sốt Me', desc: 'Ổ bánh mì nướng bơ vàng ruộm giòn tan dùng để quết nước sốt trứng muối hoặc sốt me béo ngậy.' },
      { name: 'Bia Hơi Hà Nội / Trúc Bạch Ướp Lạnh', desc: 'Bia lon mát lạnh thơm men hoa bia sảng khoái nâng tầm bàn tiệc hải sản.' },
      { name: 'Nước Chanh Leo Hạt Chia Đá Lạnh', desc: 'Nước chanh dây chua ngọt tươi mát dồi dào vitamin C kích thích vị giác giải nhiệt.' },
      { name: 'Nước Dừa Xiêm Bến Tre Tươi Ngọt Cả Quả', desc: 'Nước dừa xiêm ngọt lịm tự nhiên giải nhiệt tức thì thanh lọc cơ thể.' },
      { name: 'Sữa Chua Trân Châu Nước Cốt Dừa Mát Lạnh', desc: 'Sữa chua dẻo chua nhẹ ăn cùng trân châu nước cốt dừa ấm nóng béo ngậy giòn sần sật.' }
    ];
  }

  // 11. STREET FOOD & SNACKS (Bánh Tráng Trộn, Bột Chiên, Nem Chua Rán, Bánh Giò, Bánh Đúc, Bánh Mì Nướng)
  if (allLower.includes('bánh tráng') || allLower.includes('nem chua rán') || allLower.includes('bột chiên') || allLower.includes('bánh giò') || allLower.includes('bánh đúc')) {
    return [
      { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Món ăn vặt đường phố trứ danh làm say lòng giới trẻ với hương vị cay cay chua ngọt hòa quyện.` },
      { name: `${cui1} Chuẩn Vị Phố Cổ`, desc: 'Nguyên liệu sạch chọn lọc, tẩm ướp đậm đà vừa miệng, ăn một miếng là muốn ăn thêm.' },
      { name: `${cui2} Thơm Nức Mũi`, desc: 'Hương thơm nức mũi của hành phi giòn, mỡ hành béo ngậy và gia vị bí truyền khó quên.' },
      { name: 'Nem Chua Rán Lăn Bột Xù Giòn Rụm', desc: 'Nem chua phố cổ tẩm bột xù chiên vàng ráo dầu, cắn ngập miệng dai giòn chấm tương ớt cay xè.' },
      { name: 'Trứng Cút Lộn Xào Me Cay Ngọt Lạc Rang', desc: 'Trứng cút lộn sốt me chua ngọt đậm đà rắc đậu phộng rang giòn và rau răm thơm nồng ấm bụng.' },
      { name: 'Mẹt Ăn Vặt Tổng Hợp Đầy Đặn Thượng Hạng', desc: 'Mẹt lớn tổng hợp đầy đủ nem rán, khoai chiên, phô mai que, cá viên chiên giòn rụm.' },
      { name: 'Đĩa Xoài Non Bào Sợi Chấm Muối Tôm Cay Xè', desc: 'Xoài non giòn chua sần sật chấm muối tôm Tây Ninh cay xè kích thích vị giác.' },
      { name: 'Đĩa Tép Khô Sấy Bơ Tỏi & Hành Phi Bổ Sung', desc: 'Tép sấy thơm giòn, bò khô xé sợi và hành phi giòn rụm thêm nhiều cho món ăn vặt.' },
      { name: 'Trà Tắc Xí Muội Đá Lạnh Giải Khát', desc: 'Trà lài pha cốt tắc chua thanh xí muội mặn ngọt giải nhiệt tức thì.' },
      { name: 'Trà Dâu Tằm Pha Lê Mát Lạnh', desc: 'Trà lài ngâm dâu tằm Đà Lạt đỏ mọng chua ngọt sảng khoái đã khát.' },
      { name: 'Sữa Đậu Nành Tươi Nấu Nóng Thơm Bùi', desc: 'Sữa đậu nành nguyên chất nấu thủ công thơm ngậy ấm lòng.' },
      { name: 'Caramen Thạch Trân Châu Đường Đen Mát Lạnh', desc: 'Bánh caramen núng nính béo ngậy ăn cùng thạch rau câu và trân châu dẻo giòn.' }
    ];
  }

  // 12. VIETNAMESE TRADITIONAL (Cơm tấm, Bánh mì, Hủ tiếu, Bún, Xôi, Cháo, Bò tơ, Dê núi...)
  let side1Name = 'Đĩa Rau Sống Tươi Rối Rửa Sạch Khử Khuẩn';
  let side1Desc = 'Rau xà lách, tía tô, kinh giới, giá đỗ và húng quế tươi non rửa sạch khử khuẩn ăn kèm nước dùng.';
  let side2Name = 'Phần Thịt Topping Tươi Ngon Bổ Sung';
  let side2Desc = 'Thêm đĩa thịt thái mỏng tẩm ướp đậm đà mềm mọng nước chấm gia vị đậm đà.';

  if (nLower.includes('cơm tấm')) {
    side1Name = 'Đĩa Đồ Chua Củ Cải Cà Rốt & Dưa Leo Cà Chua Giòn Mát';
    side1Desc = 'Cà rốt củ cải ngâm giấm chua ngọt kèm dưa leo cà chua tươi giòn giải ngấy cho đĩa cơm sườn.';
    side2Name = 'Chén Mỡ Hành Tóp Mỡ Giòn Tan & Trứng Ốp La Thêm';
    side2Desc = 'Mỡ hành thơm ngậy tóp mỡ giòn rụm lách tách và quả trứng ốp la lòng đào vàng óng chảy béo ngậy.';
  } else if (nLower.includes('bánh mì')) {
    side1Name = 'Đĩa Dưa Chuột Chẻ & Đồ Chua Ăn Kèm';
    side1Desc = 'Dưa leo tươi chẻ mỏng giòn rụm và đu đủ chua ngọt kẹp thêm chống ngấy cho bánh mì.';
    side2Name = 'Chén Pate Gan Heo Nóng Hổi & Bơ Tươi Thêm';
    side2Desc = 'Pate gan heo béo bùi thơm lừng tiêu sọ và bơ trứng gà vàng ươm phết thêm đẫy đà.';
  } else if (nLower.includes('cháo lòng')) {
    side1Name = 'Đĩa Rau Thơm Húng Chó & Hành Hoa Tươi Mới';
    side1Desc = 'Húng thơm, hành hoa và ớt chỉ thiên cay nồng ăn kèm bát cháo lòng ấm nóng.';
    side2Name = 'Đĩa Lòng Non & Dồi Sụn Nướng Thêm Đầy Đặn';
    side2Desc = 'Lòng non luộc trắng phau giòn sần sật và dồi sụn nướng than hoa thơm lừng chấm mắm tôm.';
  } else if (nLower.includes('cháo sườn') || nLower.includes('cháo ếch')) {
    side1Name = 'Đĩa Quẩy Giòn Nóng Hổi (5 chiếc)';
    side1Desc = 'Quẩy vàng ruộm giòn tan bẻ từng khúc thả vào bát cháo nóng ngấm đượm vị ngọt béo.';
    side2Name = 'Đĩa Ruốc Thịt Heo & Hành Phi Giòn Rụm Thêm';
    side2Desc = 'Ruốc thịt heo sao vàng tơi xốp và hành phi ta thơm nức mũi rắc thêm ngập bát cháo.';
  } else if (nLower.includes('xôi')) {
    side1Name = 'Đĩa Dưa Góp Giòn Chua Ngọt Ăn Kèm Xôi';
    side1Desc = 'Dưa chuột thái mỏng ngâm giấm đường chua ngọt thanh mát ăn cùng xôi dẻo chống ngấy.';
    side2Name = 'Phần Thịt Kho Tàu & Chả Cốm Nóng Thêm';
    side2Desc = 'Thịt ba chỉ kho trứng mềm rục ngấm đẫm nước sốt đậm đà và chả cốm chiên giòn thơm nức mũi.';
  } else if (nLower.includes('bánh cuốn') || nLower.includes('bánh ướt')) {
    side1Name = 'Đĩa Rau Thơm & Giá Đỗ Trần Thanh Mát';
    side1Desc = 'Giá đỗ chần sơ giòn ngọt và rau kinh giới quế tươi ăn kèm đĩa bánh cuốn ấm nóng.';
    side2Name = 'Đĩa Chả Quế Nướng & Nem Chua Rán Thêm';
    side2Desc = 'Chả quế nướng vàng ruộm thơm lừng mùi quế chi và nem rán giòn chấm nước mắm cà cuống ngọt dịu.';
  } else if (nLower.includes('bò tơ') || nLower.includes('dê núi')) {
    side1Name = 'Mẹt Rau Rừng Tây Ninh & Bánh Tráng Phơi Sương';
    side1Desc = 'Hơn 10 loại rau rừng non như lá cóc, sao nhái, đọt choại cuốn bánh tráng phơi sương Trảng Bàng.';
    side2Name = 'Chén Nước Chấm Mắm Nêm Đậm Đà / Chao Môn Sa Tế';
    side2Desc = 'Mắm nêm pha dứa ớt tỏi băm thơm nồng hoặc chao môn béo ngậy chấm thịt nướng đậm đà.';
  }

  return [
    { name: `${spec.name} - Món Tủ Đặc Biệt`, desc: `${desc} Hương vị đậm đà nguyên bản làm nên thương hiệu được thực khách khắp nơi yêu mến.` },
    { name: `${cui1} Chuẩn Vị Gia Truyền`, desc: `Món ăn nấu theo công thức gia truyền lâu năm với nước dùng ngọt đậm đà từ xương hầm và thịt tươi ngon mềm mọng.` },
    { name: `${cui2} Thơm Nức Mũi Đầy Đặn`, desc: `Suất ăn thịnh soạn kết hợp đầy đủ các phần thịt thơm mềm, đậm đà gia vị truyền thống thơm lừng khó quên.` },
    { name: `${cui3 ? cui3 : cui1} Đậm Đà Khó Cưỡng`, desc: `Hương vị chế biến kỳ công với công thức gia vị độc quyền làm bùng nổ vị giác thực khách.` },
    { name: `${cui1} Suất Nhỏ Vừa Vặn`, desc: `Suất ăn vừa vặn thanh đạm với lượng calo hợp lý thích hợp cho bữa ăn nhẹ hoặc trẻ nhỏ.` },
    { name: `${spec.name.split(' ')[0]} ${spec.name.split(' ')[1]} Thượng Hạng Tuyển Chọn`, desc: `Phiên bản đặc biệt tuyển chọn nguyên liệu thượng hạng tươi ngon ngọt bùi nhất của quán.` },
    { name: side1Name, desc: side1Desc },
    { name: side2Name, desc: side2Desc },
    { name: 'Trà Tắc Hạt Chia Đá Lạnh', desc: 'Trà lài pha quả tắc tươi vắt mọng nước thêm hạt chia thanh mát giải nhiệt sảng khoái.' },
    { name: 'Trà Đào Cam Sả Thơm Mát', desc: 'Trà lài đào ngâm giòn ngọt thơm nức mũi sả tươi kích thích tiêu hóa.' },
    { name: 'Sữa Đậu Nành Lá Dứa Nấu Mộc', desc: 'Sữa hạt đậu nành nguyên chất nấu cùng lá dứa thơm bùi ít ngọt tốt cho sức khỏe.' },
    { name: 'Caramen Thạch Dừa Mát Lạnh Phố Cổ', desc: 'Bánh caramen núng nính béo ngậy ăn cùng thạch dừa giòn sần sật và cà phê đá thơm bùi.' }
  ];
}

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Connected to PostgreSQL database.');

  // 1. Fix restaurant 100 name if needed
  const r100Res = await client.query("UPDATE restaurants SET name = 'Hải Sản Biển Đông Cua Ghẹ Tươi Sống' WHERE id = 100 AND name != 'Hải Sản Biển Đông Cua Ghẹ Tươi Sống' RETURNING id, name");
  if (r100Res.rows.length > 0) {
    console.log('Successfully updated restaurant 100 name to:', r100Res.rows[0].name);
  } else {
    console.log('Restaurant 100 name is already correct.');
  }

  // 2. Loop through all 90 restaurants (id 11 to 100) and update their 12 foods
  let updatedFoodCount = 0;

  for (const spec of specs) {
    const resId = spec.id;
    // Get existing 12 foods for this restaurant ordered by id
    const fRes = await client.query('SELECT id, name, description FROM foods WHERE restaurant_id = $1 AND deleted_at IS NULL ORDER BY id ASC', [resId]);
    const foods = fRes.rows;

    if (foods.length === 0) {
      console.warn(`No foods found for restaurant id ${resId}`);
      continue;
    }

    const dishes = buildDishesForSpec(spec);

    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const newDish = dishes[i % dishes.length];

      // Update name and description
      await client.query(
        'UPDATE foods SET name = $1, description = $2, updated_at = NOW() WHERE id = $3',
        [newDish.name, newDish.desc, food.id]
      );
      updatedFoodCount++;
    }

    console.log(`Updated 12 foods for restaurant #${resId}: "${spec.name}"`);
  }

  console.log(`\nAll done! Total foods updated: ${updatedFoodCount}`);

  await client.end();
}

run().catch(console.error);
