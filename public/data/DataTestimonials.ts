import type { TestimonialItem } from "@/types";

interface DataTestimonialsType {
  items: {
    Images: TestimonialItem[];
    ImagesMobile: TestimonialItem[];
  };
}

const DataTestimonials: DataTestimonialsType = {
  items: {
    Images: [
      { id: 1, title: "testimonial 1", src: "/images/session09/testimonial1.png" },
      { id: 2, title: "testimonial 2", src: "/images/session09/testimonial2.png" },
      { id: 3, title: "testimonial 3", src: "/images/session09/testimonial3.png" },
      { id: 4, title: "testimonial 4", src: "/images/session09/testimonial4.png" },
      { id: 5, title: "testimonial 5", src: "/images/session09/testimonial5.png" },
      { id: 6, title: "testimonial 6", src: "/images/session09/testimonial6.png" },
      { id: 7, title: "testimonial 7", src: "/images/session09/testimonial7.png" },
      { id: 8, title: "testimonial 8", src: "/images/session09/testimonial8.png" },
      { id: 9, title: "testimonial 9", src: "/images/session09/testimonial9.png" },
    ],
    ImagesMobile: [
      { id: 1, title: "testimonial mobile 1", src: "/images/session09/mobile/testimonial1.png" },
      { id: 2, title: "testimonial mobile 2", src: "/images/session09/mobile/testimonial2.png" },
      { id: 3, title: "testimonial mobile 3", src: "/images/session09/mobile/testimonial3.png" },
      { id: 4, title: "testimonial mobile 4", src: "/images/session09/mobile/testimonial4.png" },
      { id: 5, title: "testimonial mobile 5", src: "/images/session09/mobile/testimonial5.png" },
      { id: 6, title: "testimonial mobile 6", src: "/images/session09/mobile/testimonial6.png" },
      { id: 7, title: "testimonial mobile 7", src: "/images/session09/mobile/testimonial7.png" },
      { id: 8, title: "testimonial mobile 8", src: "/images/session09/mobile/testimonial8.png" },
      { id: 9, title: "testimonial mobile 9", src: "/images/session09/mobile/testimonial9.png" },
    ],
  },
};

export default DataTestimonials;
