import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gazyva 佳罗华全景财务与部署看板",
  description: "Gazyva Financial & Deployment Dashboard with AI Growth Simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
