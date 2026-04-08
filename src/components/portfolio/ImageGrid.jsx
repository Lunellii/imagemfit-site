import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

export default function ImageGrid({ images }) {
  const [lightbox, setLightbox] = useState(null);

  if (!images.length) {
    return (
      <div className="text-center py-16">
        <p className="text-white/40 text-sm">Nenhuma imagem nesta categoria ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {images.map((img) => (
            <motion.div
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
              className="group relative aspect-square overflow-hidden cursor-pointer bg-card"
              onClick={() => setLightbox(img)}
            >
              <img
                src={img.image_url}
                alt={img.title || img.code}
                loading="lazy"
                decoding="async"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
                <p className="text-white text-xs font-medium truncate">{img.title || img.code}</p>
                <p className="text-gold text-xs font-mono mt-0.5">#{img.code}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/97 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-6 right-6 text-white/60 hover:text-gold transition-colors" onClick={() => setLightbox(null)}>
              <X size={26} />
            </button>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }} className="max-w-4xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightbox.image_url}
                alt={lightbox.title || lightbox.code}
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="w-full max-h-[72vh] object-contain"
              />
              <div className="mt-4 flex items-center justify-between border-t border-gold/20 pt-4">
                <p className="font-heading text-lg text-white">{lightbox.title || lightbox.code}</p>
                <p className="text-gold font-mono text-sm">#{lightbox.code}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
