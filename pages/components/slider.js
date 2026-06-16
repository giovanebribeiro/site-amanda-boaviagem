// Deprecated: este componente será removido no Phase 2 do redesign.
// Substituído por CSS + Tailwind sem dependência de react-responsive-carousel.

import React from "react";

const Slider = ({ images = [] }) => {
  if (!images.length) return null;
  return (
    <div className="Slider">
      <img src={images[0].src} alt={images[0].title} style={{ width: "100%" }} />
    </div>
  );
};

export default Slider;