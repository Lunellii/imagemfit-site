import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ImageIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const ROTATION_MS = 4200;

export default function RotatingCategoryCard({ category, linkTo, coverImages = [], className = "", imageHeight = "h-52" }) {
  const availableImages = useMemo(
    () => coverImages.filter((image) => typeof image?.image_url === "string" && image.image_url.length > 0),
    [coverImages]
  );
  const coverEnabled = category?.cover_enabled ?? true;
  const canShowCover = coverEnabled && availableImages.length > 0;
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [category?.id, availableImages.length]);

  useEffect(() => {
    if (!canShowCover || availableImages.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % availableImages.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [canShowCover, availableImages.length]);

  const activeImage = canShowCover ? availableImages[imageIndex] : null;

  return (
    <Link to={linkTo} className={`group block border border-border bg-card h-full hover:border-gold/50 transition-colors ${className}`}>
      <div className={`relative overflow-hidden border-b border-border ${imageHeight}`}>
        {activeImage ? (
          <>
            <AnimatePresence mode="wait">
              <motion.img
                key={`${category.id}-${activeImage.id || imageIndex}`}
                src={activeImage.image_url}
                alt={`${category.name} - capa`}
                loading="lazy"
                decoding="async"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0.2, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <div className="absolute top-3 left-3">
              <span className="text-[10px] uppercase tracking-[0.25em] border border-gold/60 text-gold px-2 py-1 bg-black/60">Capa</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(199,161,90,0.18),_rgba(0,0,0,0.95)_60%)] flex flex-col items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gold/45 mb-2" />
            <span className="font-heading text-white/70 text-4xl">{String(category?.name || "?").charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold/70 mb-2">Categoria</p>
            <h3 className="font-heading text-xl text-white leading-tight">{category.name}</h3>
            {category.description ? <p className="text-white/55 text-xs mt-2 leading-relaxed">{category.description}</p> : null}
          </div>
          <div className="w-9 h-9 border border-gold/40 flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:bg-gold group-hover:text-black transition-all">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-gold/60 to-transparent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
      </div>
    </Link>
  );
}
