import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
  alternates: {
    types: {
      "application/rss+xml": `${siteUrl}/feed.xml`,
    },
  },
};

// JSON-LD WebSite Schema with SearchAction
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "골프 장비 리뷰",
  alternateName: "Golf Equipment Review",
  url: siteUrl,
  description: "골프 드라이버, 아이언, 퍼터 등 골프 장비 리뷰와 추천 정보를 제공합니다.",
  inLanguage: "ko-KR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// JSON-LD Organization Schema
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "골프 장비 리뷰",
  alternateName: "Golf Equipment Review",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "골프 장비 전문 리뷰 블로그",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Korean"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        {/* JSON-LD WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
