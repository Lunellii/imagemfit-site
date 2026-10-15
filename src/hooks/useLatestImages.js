import { useEffect, useState } from "react";
import { localClient } from "@/api/localClient";

// Últimas peças publicadas, já com o nome da categoria de cada uma.
export function useLatestImages(limit = 8) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([localClient.entities.Category.list("order", 500), localClient.entities.PortfolioImage.list("-created_date", limit)])
      .then(([categories, items]) => {
        if (!mounted) return;
        const nameById = Object.fromEntries(categories.map((category) => [category.id, category.name]));
        setImages(items.map((image) => ({ ...image, category_name: image.category_name || nameById[image.category_id] || "" })));
      })
      .catch(() => {
        if (mounted) setImages([]);
      });

    return () => {
      mounted = false;
    };
  }, [limit]);

  return images;
}
