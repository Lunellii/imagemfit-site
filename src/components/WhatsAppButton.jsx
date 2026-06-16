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
        const image = item.image_url ? `\n  Imagem: ${absoluteUrl(item.image_url)}` : "";
        return `- Codigo: #${item.code}${title}${category}${image}`;
      })
      .join("\n");

    return `Ola! Tenho interesse nos seguintes quadros:\n\n${lines}\n\nGostaria de saber preco, tamanho, moldura e material disponiveis.`;
  };

  const shortenText = (text, context, maxWidth) => {
    let value = String(text || "");
    while (value && context.measureText(value).width > maxWidth) {
      value = value.slice(0, -1);
    }
    return value.length < String(text || "").length ? `${value.trimEnd()}...` : value;
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

  const createCartImage = async () => {
    const visibleItems = cart.slice(0, 24);
    const hiddenCount = cart.length - visibleItems.length;
    const images = await Promise.all(visibleItems.map((item) => loadImage(item.image_url)));
    const columns = visibleItems.length === 1 ? 1 : visibleItems.length === 2 ? 2 : 3;
    const width = columns === 1 ? 720 : 960;
    const padding = 32;
    const gap = 20;
    const headerHeight = 112;
    const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
    const imageHeight = Math.round(cardWidth * 0.72);
    const cardHeight = imageHeight + 82;
    const rows = Math.ceil(visibleItems.length / columns);
    const footerHeight = hiddenCount ? 90 : 66;
    const height = padding + headerHeight + rows * cardHeight + gap * (rows - 1) + footerHeight + padding;
    const pixelRatio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = "#111111";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#c7a15a";
    context.font = "700 28px Arial";
    context.fillText("Imagem Fit Quadros", padding, padding + 34);
    context.fillStyle = "#ffffff";
    context.font = "16px Arial";
    context.fillText("Quadros selecionados para orcamento", padding, padding + 64);

    visibleItems.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = padding + col * (cardWidth + gap);
      const y = padding + headerHeight + row * (cardHeight + gap);

      context.fillStyle = "#f7f2e8";
      context.fillRect(x, y, cardWidth, cardHeight);
      context.fillStyle = "#ffffff";
      context.fillRect(x + 10, y + 10, cardWidth - 20, imageHeight);
      drawFittedImage(context, images[index], x + 10, y + 10, cardWidth - 20, imageHeight);
      context.strokeStyle = "#d6cfbf";
      context.strokeRect(x + 10, y + 10, cardWidth - 20, imageHeight);
      context.fillStyle = "#111111";
      context.font = "700 20px Arial";
      context.fillText(`#${item.code}`, x + 12, y + imageHeight + 38);
      context.font = "14px Arial";
      context.fillStyle = "#555555";
      const subtitle = item.title && item.title !== item.code ? item.title : item.category || "";
      if (subtitle) context.fillText(shortenText(subtitle, context, cardWidth - 24), x + 12, y + imageHeight + 60);
      if (item.category && subtitle !== item.category) {
        context.fillText(shortenText(item.category, context, cardWidth - 24), x + 12, y + imageHeight + 78);
      }
    });

    const footerY = padding + headerHeight + rows * cardHeight + gap * (rows - 1) + 30;
    context.fillStyle = "#ffffff";
    context.font = "17px Arial";
    context.fillText("Gostaria de saber preco, tamanho, moldura e material disponiveis.", padding, footerY);
    if (hiddenCount) {
      context.fillStyle = "#c7a15a";
      context.font = "15px Arial";
      context.fillText(`+ ${hiddenCount} outro(s) quadro(s) no texto copiado.`, padding, footerY + 28);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG_FAILED"))), "image/png");
    });
  };

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
        const imageBlob = await createCartImage();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": imageBlob })]);
        setCopied("image");
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
                      <Check size={13} /> {copied === "image" ? "Imagem copiada" : "Mensagem copiada"}
                    </>
                  ) : (
                    <>
                      <ClipboardCopy size={13} /> Copiar imagem dos quadros
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
