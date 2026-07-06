import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ChatWidget } from "@/components/chat/ChatWidget";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "BuaCom.AI – Thực đơn gia đình Việt",
  description: "Gợi ý thực đơn 7 ngày theo chuẩn dinh dưỡng Việt Nam 2016, cá nhân hoá cho từng thành viên gia đình.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "BuaCom.AI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Prevent dark mode FOUC — runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
