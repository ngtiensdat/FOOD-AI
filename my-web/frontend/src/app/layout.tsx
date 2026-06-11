// Mục đích: Định nghĩa Layout gốc (RootLayout) cho toàn bộ ứng dụng Next.js (Frontend).
// Các file khác hay file này có ý nghĩa như nào: Bọc tất cả các trang con, thiết lập font chữ, ThemeProvider, LanguageProvider, ToastContainer và nạp file script khởi tạo theme.
// Các chức năng đặc biệt: Đọc ngôn ngữ hiện tại từ cookie để đồng bộ hóa trạng thái ngôn ngữ phía Server và Client, tránh lỗi Hydration.
// Kiến thức, Design Pattern, nguyên tắc: Layout Pattern trong Next.js App Router, Hydration Mismatch Avoidance.
// Các biến, hàm đặc biệt: RootLayout, metadata.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import { ToastContainer } from "@/components/base/ToastContainer";
import { ThemeProvider } from "@/providers/theme-provider";
import { LABELS } from "@/constants/labels";
import Script from "next/script";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/providers/language-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: LABELS.COMMON.APP_TITLE,
  icons: {
    icon: '/logo.png'
  }
}

export default async function RootLayout({
  children, //truyền trang vào để hiển thị
}: Readonly<{ //đảm bảo các trang truyền vào không bị thay đổi
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value || 'vi';

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-initializer"
          src="/theme-init.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider lang={lang}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
        <ToastContainer />
      </body>
    </html>         //đảm bảo vị trí body và footer luôn ở dưới cùng
  );
}
