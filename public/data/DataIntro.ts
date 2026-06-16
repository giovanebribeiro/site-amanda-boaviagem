import type { BannerItem } from "@/types";

interface DataIntroType {
  items: {
    bannersDesktop: BannerItem[];
    bannersMobile: BannerItem[];
  };
}

const DataIntro: DataIntroType = {
  items: {
    bannersDesktop: [
      {
        id: 1,
        title: "banner 1 desktop",
        src: "/images/session01/banner1.png",
      },
    ],
    bannersMobile: [
      {
        id: 1,
        title: "banner 1 mobile",
        src: "/images/session01/banner1Mobile.png",
      },
    ],
  },
};

export default DataIntro;
