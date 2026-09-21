import type { Metadata, Viewport } from "next";
import { Onest, Lora, Manrope, Montserrat, Merriweather } from "next/font/google";
import "./globals.css";

// Три пары шрифтов для выбора на живой странице (?font=a|b|c); после выбора лишние убрать
const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], display: "swap" });
const lora = Lora({ variable: "--font-lora", subsets: ["latin", "cyrillic"], weight: ["500", "600"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], display: "swap" });
const merriweather = Merriweather({ variable: "--font-merriweather", subsets: ["latin", "cyrillic"], weight: ["700"], display: "swap" });

export const metadata: Metadata = {
  title: "Аренда усадьбы под Минском — расчёт стоимости | Добра Хата",
  description:
    "Усадьба «Добра Хата» в Раубичах, 20 км от Минска: бассейн, спортплощадка, «Пагода» на пруду, банный комплекс. Посчитайте стоимость аренды на сутки или день для вашей компании — от 1 100 руб.",
  openGraph: {
    title: "Добра Хата — сколько выйдет на вашу компанию",
    description:
      "Выберите формат, дату и число гостей — сумма считается сразу. Усадьба в Раубичах, 20 км от Минска.",
    locale: "ru_BY",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ebe0" },
    { media: "(prefers-color-scheme: dark)", color: "#16241c" },
  ],
};

// Тема выставляется до первой отрисовки, чтобы не мигало
const themeScript = `(function(){try{var m=location.search.match(/[?&]theme=(light|dark)/);var t=m?m[1]:localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Усадьба «Добра Хата»",
  address: {
    "@type": "PostalAddress",
    streetAddress: "пер. Школьный, 1, д. Прилепы",
    addressRegion: "Минская область",
    addressCountry: "BY",
  },
  geo: { "@type": "GeoCoordinates", latitude: 54.075906, longitude: 27.83404 },
  telephone: "+375298576768",
  priceRange: "от 1 100 BYN",
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Открытый бассейн 5×10 м" },
    { "@type": "LocationFeatureSpecification", name: "Спортплощадка: теннис, баскетбол, мини-футбол" },
    { "@type": "LocationFeatureSpecification", name: "Банкетный павильон «Пагода» до 70 гостей" },
    { "@type": "LocationFeatureSpecification", name: "Банный комплекс: финская, русская, хаммам" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${onest.variable} ${lora.variable} ${manrope.variable} ${montserrat.variable} ${merriweather.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
