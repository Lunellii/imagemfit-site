import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ClipboardCopy, ShoppingCart, X, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const { cart, removeItem, clearCart } = useCart();

  const absoluteUrl = (src) => {
    try {
      return src ? new URL(src, window.location.origin).href : "";
    } catch (_error) {
      return src || "";
    }
  };

  const buildMessage = () => {
    if (!cart.length) return "";
    const lines = cart
      .map((item) => {
        const title = item.title && item.title !== item.code ? ` - ${item.title}` : "";
        const category = item.category ? ` (${item.category})` : "";
        return `- Codigo: #${item.code}${title}${category}`;
      })
      .join("\n");

    return `Ola! Tenho interesse nos seguintes quadros:\n\n${lines}\n\nGostaria de saber preco, tamanho, moldura e material disponiveis.`;
  };

  const loadImage = (src) =>
    new Promise((resolve) => {
      const url = absoluteUrl(src);
      if (!url) {
        resolve(null);
        return;
      }

      const image = new Image();
      try {
        if (new URL(url).origin !== window.location.origin) {
          image.crossOrigin = "anonymous";
        }
      } catch (_error) {
        // Keep loading even if URL parsing fails.
      }
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    });

  const fitImageRect = (image, maxWidth, maxHeight) => {
    if (!image) return { width: 900, height: 900 };
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    return {
      width: Math.max(360, Math.round(image.width * scale)),
      height: Math.max(360, Math.round(image.height * scale)),
    };
  };

  const drawFittedImage = (context, image, x, y, width, height) => {
    if (!image) {
      context.fillStyle = "#e7e2d7";
      context.fillRect(x, y, width, height);
      context.fillStyle = "#777";
      context.font = "14px Arial";
      context.textAlign = "center";
      context.fillText("Imagem indisponivel", x + width / 2, y + height / 2);
      context.textAlign = "left";
      return;
    }

    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  };

  const createCaptionedImage = async (item) => {
    const image = await loadImage(item.image_url);
    const imageBox = fitImageRect(image, 1200, 1200);
    const captionHeight = 118;
    const width = imageBox.width;
    const height = imageBox.height + captionHeight;
    const pixelRatio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, imageBox.height);
    drawFittedImage(context, image, 0, 0, imageBox.width, imageBox.height);

    context.fillStyle = "#111111";
    context.fillRect(0, imageBox.height, width, captionHeight);
    context.fillStyle = "#c7a15a";
    context.font = "700 42px Arial";
    context.fillText(`#${item.code}`, 34, imageBox.height + 52);
    const subtitle = item.title && item.title !== item.code ? item.title : item.category || "";
    if (subtitle) {
      context.fillStyle = "#ffffff";
      context.font = "24px Arial";
      context.fillText(subtitle, 34, imageBox.height + 88);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG_FAILED"))), "image/png");
    });
  };

  const createCaptionedImages = async () => Promise.all(cart.map((item) => createCaptionedImage(item)));

  const fallbackCopy = (message) => {
    const textarea = document.createElement("textarea");
    textarea.value = message;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    const message = buildMessage();
    if (!message) return;

    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        const imageBlobs = await createCaptionedImages();
        const messageBlob = new Blob([message], { type: "text/plain" });
        const clipboardItems = imageBlobs.map((imageBlob, index) => {
          const data = { "image/png": imageBlob };
          if (index === 0) data["text/plain"] = messageBlob;
          return new ClipboardItem(data);
        });
        try {
          await navigator.clipboard.write(clipboardItems);
          setCopied(imageBlobs.length > 1 ? "images" : "image");
        } catch (_multipleError) {
          await navigator.clipboard.write([clipboardItems[0]]);
          setCopied("image");
        }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        setCopied("text");
      } else {
        fallbackCopy(message);
        setCopied("text");
      }
    } catch (_error) {
      fallbackCopy(message);
      setCopied("text");
    }

    window.setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-[#1c1c1c] border border-gold/30 w-80 shadow-2xl overflow-hidden"
          >
            <div className="bg-gold px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-black" />
                <span className="text-black font-semibold text-sm">Carrinho ({cart.length})</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-black/60 hover:text-black">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-8">Nenhum produto no carrinho.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {item.image_url && <img src={item.image_url} alt={item.code} className="w-10 h-10 object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-gold font-mono text-xs font-semibold">#{item.code}</p>
                        {item.title && item.title !== item.code && <p className="text-white/50 text-xs truncate">{item.title}</p>}
                        {item.category && <p className="text-white/30 text-xs">{item.category}</p>}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-white/10 space-y-2">
                <button
                  onClick={handleCopy}
                  className="w-full bg-gold text-black py-3 text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-gold/90 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={13} /> {copied === "images" ? "Imagens e mensagem copiadas" : copied === "image" ? "Imagem e mensagem copiadas" : "Mensagem copiada"}
                    </>
                  ) : (
                    <>
                      <ClipboardCopy size={13} /> Copiar imagens e mensagem
                    </>
                  )}
                </button>
                <button onClick={clearCart} className="w-full text-white/30 hover:text-white/60 text-xs py-1 transition-colors">
                  Limpar carrinho
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-gold flex items-center justify-center shadow-lg hover:bg-gold/90 transition-colors"
      >
        {open ? <X size={22} className="text-black" /> : <ShoppingCart size={22} className="text-black" />}
        {!open && cart.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            {cart.length}
          </span>
        )}
      </motion.button>
    </div>
  );
}
