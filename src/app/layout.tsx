import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://golf-blog.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "골프 장비 리뷰 | 드라이버, 아이언, 퍼터 추천",
    template: "%s | 골프 장비 리뷰",
  },
  description:
    "골프 드라이버, 아이언, 퍼터 등 골프 장비 리뷰와 추천 정보를 제공합니다. 캘러웨이, 타이틀리스트, 테일러메이드 등 인기 브랜드 제품을 비교 분석합니다.",
  keywords: ["골프", "골프 장비", "드라이버 추천", "골프 클럽", "골프 용품"],
  authors: [{ name: "Golf Review Blog" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "골프 장비 리뷰",
    title: "골프 장비 리뷰 | 드라이버, 아이언, 퍼터 추천",
    description:
      "골프 드라이버, 아이언, 퍼터 등 골프 장비 리뷰와 추천 정보를 제공합니다.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
