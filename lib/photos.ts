export interface Photo {
  src: string;
  alt: string;
  caption: string;
}

/** Фотографии усадьбы, обработанные из материалов клиента (см. public/photos) */
export const PHOTOS: readonly Photo[] = [
  { src: "/photos/pool.jpg", alt: "Открытый бассейн с деревянной террасой и шезлонгами", caption: "Бассейн 5×10 м с террасой" },
  { src: "/photos/pagoda.jpg", alt: "Павильон «Пагода» в японском стиле на пруду с мостиком", caption: "«Пагода» на пруду — банкеты до 70 гостей" },
  { src: "/photos/house.jpg", alt: "Двухэтажный дом усадьбы, вид с террасы бассейна", caption: "Дом — 14–18 спальных мест" },
  { src: "/photos/court.jpg", alt: "Спортплощадка с теннисной сеткой, баскетбольными щитами и воротами", caption: "Спортплощадка: теннис, баскетбол, мини-футбол" },
  { src: "/photos/bath.jpg", alt: "Русская парная в банном комплексе", caption: "Бани: финская, русская, хаммам" },
  { src: "/photos/pagoda-hall.jpg", alt: "Накрытые столы внутри павильона «Пагода»", caption: "Банкет в «Пагоде»" },
];
