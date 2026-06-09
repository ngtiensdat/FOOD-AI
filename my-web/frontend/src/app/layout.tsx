import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import { ToastContainer } from "@/components/base/ToastContainer";
import { ThemeProvider } from "@/providers/theme-provider";
import { LABELS } from "@/constants/labels";

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

export default function RootLayout({
  children, //truyền trang vào để hiển thị
}: Readonly<{ //đảm bảo các trang truyền vào không bị thay đổi
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme') || 'mixed';
                document.documentElement.classList.remove('dark', 'mixed');
                if (savedTheme === 'dark' || savedTheme === 'mixed') {
                  document.documentElement.classList.add(savedTheme);
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <ToastContainer />
      </body>
    </html>         //đảm bảo vị trí body và footer luôn ở dưới cùng
  );
}
