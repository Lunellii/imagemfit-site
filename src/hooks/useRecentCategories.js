import { useEffect, useState } from "react";
import { localClient } from "@/api/localClient";

// Categorias que receberam imagens novas mais recentemente, com as capas de cada uma.
export function useRecentCategories(limit = 6) {
  const [state, setState] = useState({ categories: [], imagesByCategory: {}, loading: true });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const cats = await localClient.entities.Category.list("order", 500);
        const grouped = await localClient.entities.PortfolioImage.groupedByCategory(
          "-created_date",
          8,
          cats.map((category) => category.id)
        );
        const latestUpload = (category) => {
          const time = Date.parse(grouped[category.id]?.[0]?.created_date || "");
          return Number.isFinite(time) ? time : 0;
        };
        const recent = cats
          .filter((category) => grouped[category.id]?.length)
          .sort((a, b) => latestUpload(b) - latestUpload(a))
          .slice(0, limit);

        if (mounted) setState({ categories: recent, imagesByCategory: grouped, loading: false });
      } catch {
        if (mounted) setState({ categories: [], imagesByCategory: {}, loading: false });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [limit]);

  return state;
}
