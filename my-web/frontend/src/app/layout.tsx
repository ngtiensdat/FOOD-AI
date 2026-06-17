import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import { ToastContainer } from "@/components/base/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FOOD AI - Món ngon mỗi ngày"
}

export default function RootLayout({
  children, //truyền trang vào để hiển thị
}: Readonly<{ //đảm bảo các trang truyền vào không bị thay đổi
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <ToastContainer />
      </body>
    </html>         //đảm bảo vị trí body và footer luôn ở dưới cùng
  );
}
