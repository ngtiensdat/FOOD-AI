const axios = require('axios');
const fs = require('fs');

// ĐÂY LÀ HEADERS BẠN VỪA COPY (Nó chứa Token và các mã xác thực chống bot)
const HEADERS = {
  '339f96c9': `Wg**\`BrK!']hM.8hK8Z!k:KsQ`,
  '8bc114c9': `'ep$U3@f)t^j.(;h+%6AH>,6D`,
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
  'b42cacb': `n>(-Cg/_op7oj>27+\`_]c&34e0MVs_MaT:s%'sMeg<MU'cZq_1[*j/Rm'YqCBOK5*CrSslK&?SX@+-7__tD%$9,9u7/ehriC7:;k<o+8;3W2.9-f73Y@W0;M\`gm44hJj"@l!!8"a_Hc!.G@i.i"'7$IT0/L"Ct@.Ru_+CFX\`=76(<+7)/X[joaE&9,@*u6jOYT;Y!5?(@Pr(^EuHfS`,
  'origin': 'https://shopeefood.vn',
  'priority': 'u=1, i',
  'referer': 'https://shopeefood.vn/',
  'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  'x-foody-access-token': '254d94571cbdb5e1c9a6e4f96bb3157465e1650532d7e661d983e026ab9b5a39e05b97591e831475e3720b73d15fed54b091018f7117ad76a85058ac936e5012',
  'x-foody-api-version': '1',
  'x-foody-app-type': '1004',
  'x-foody-client-language': 'vi',
  'x-foody-client-type': '1',
  'x-foody-client-version': '3.0.0',
  'x-sap-ri': '9bac136a4153f34a7d7fc637c3c216b8b15f167cd523a2ed'
};

// Hàm tạo thời gian nghỉ giữa các lần lấy dữ liệu (tránh bị block IP)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function cleanImageUrl(url) {
  if (!url) return null;
  if (url.includes('susercontent.com') && url.includes('@')) {
    return url.split('@')[0];
  }
  return url;
}

// 1. Lấy thông tin cơ bản của quán (Tên, Địa chỉ, Tọa độ)
async function getRestaurantInfo(restaurantId) {
    try {
        const url = `https://gappapi.deliverynow.vn/api/delivery/get_detail?id_type=2&request_id=${restaurantId}`;
        const response = await axios.get(url, { headers: HEADERS });
        if (response.data.result !== 'success') throw new Error("API thông tin quán bị chặn hoặc lỗi.");
        return response.data.reply.delivery_detail;
    } catch (error) {
        console.error(`❌ Lỗi lấy thông tin quán ${restaurantId}:`, error.message);
        return null;
    }
}

// 2. Lấy danh sách toàn bộ Menu của quán
async function getRestaurantMenu(restaurantId) {
    try {
        const url = `https://gappapi.deliverynow.vn/api/dish/get_delivery_dishes?id_type=2&request_id=${restaurantId}`;
        const response = await axios.get(url, { headers: HEADERS });
        if (response.data.result !== 'success') throw new Error("API menu bị chặn hoặc lỗi.");
        return response.data.reply.menu_infos; // Chứa danh sách category và món ăn
    } catch (error) {
        console.error(`❌ Lỗi lấy menu quán ${restaurantId}:`, error.message);
        return null;
    }
}

async function main() {
    console.log("🚀 Bắt đầu chương trình thu thập dữ liệu từ ShopeeFood...\n");
    
    // Ở cURL của bạn, request_id đang là 7281, vậy quán này có ID là 7281.
    // Tôi thêm một ID ngẫu nhiên nữa (vd: 12345) để test vòng lặp.
    const restaurantIds = [7281]; 
    const allData = [];

    for (const id of restaurantIds) {
        console.log(`Đang cào dữ liệu quán ID: ${id}...`);
        
        // GỌI API THẬT
        const info = await getRestaurantInfo(id); 
        const menu = await getRestaurantMenu(id);
        
        if (!info || !menu) {
            console.log(`Bỏ qua quán ${id} vì lỗi lấy data.\n`);
            continue;
        }

        // Format lại dữ liệu theo chuẩn database Prisma của bạn
        const formattedData = {
            id: id,
            restaurant_name: info.name,
            address: info.address,
            lat: info.position ? info.position.latitude : 0,
            lng: info.position ? info.position.longitude : 0,
            categories: menu.map(category => ({
                name: category.dish_type_name,
                foods: category.dishes.map(dish => ({
                    name: dish.name,
                    price: dish.price ? dish.price.value : 0,
                    description: dish.description,
                    // ShopeeFood lưu ảnh trong mảng photos
                    image: dish.photos && dish.photos.length > 0 ? cleanImageUrl(dish.photos[0].value) : null
                }))
            }))
        };

        allData.push(formattedData);
        console.log(`✅ Lấy thành công quán: ${info.name}`);
        
        // Quan trọng: Nghỉ 2 giây trước khi gọi quán tiếp theo để không bị khóa IP
        await sleep(2000); 
    }

    // Ghi ra file data.json
    fs.writeFileSync('shopeefood_data.json', JSON.stringify(allData, null, 2), 'utf-8');
    console.log("\n🎉 Đã lưu toàn bộ dữ liệu vào file 'shopeefood_data.json'");
}

main();
