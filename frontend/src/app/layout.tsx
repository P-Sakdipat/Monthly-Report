import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "MD_monthly Executive Dashboard",
  description: "ระบบรายงานและวิเคราะห์ข้อมูลแผนงานประจำเดือนเชิงกลยุทธ์ส่วนผู้บริหาร เชื่อมต่อระบบฐานข้อมูลหลักเพื่อสรุปแผนสถิติประจำเดือน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
