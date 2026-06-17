// Mục đích file này để làm gì: Khởi tạo theme (giao diện sáng/tối/mixed) từ localStorage.
// Các file khác hay file này có ý nghĩa như nào: Nạp đồng bộ trước khi hydrate và vẽ giao diện (layout.tsx) để tránh hiện tượng nhấp nháy FOUC.
// Các chức năng đặc biệt: Tự động thêm class tương ứng vào documentElement một cách đồng bộ trong quá trình tải HTML ban đầu.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Theme Initialization, FOUC (Flash of Unstyled Content) Prevention.
// Các biến, hàm đặc biệt trong file: savedTheme.
try {
  const savedTheme = localStorage.getItem('theme') || 'mixed';
  document.documentElement.classList.remove('dark', 'mixed');
  if (savedTheme === 'dark' || savedTheme === 'mixed') {
    document.documentElement.classList.add(savedTheme);
  }
} catch (e) {}
