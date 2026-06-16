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

  const wrapText = (context, text, maxWidth) => {
    const lines = [];
    text.split("\n").forEach((paragraph) => {
      if (!paragraph.trim()) {
        lines.push("");
        return;
      }

      const words = paragraph.split(" ");
      let currentLine = "";
      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (context.measureText(testLine).width <= maxWidth || !currentLine) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
    });

    return lines;
  };

  const createOrderImage = async (message) => {
    const items = await Promise.all(
      cart.map(async (item) => ({
        ...item,
        image: await loadImage(item.image_url),
      })),
    );

    const columns = items.length > 4 ? 2 : 1;
    const width = columns === 1 ? 1080 : 1480;
    const padding = 44;
    const gap = 30;
    const headerHeight = 124;
    const captionHeight = 112;
    const cardWidth = Math.floor((width - padding * 2 - gap * (columns - 1)) / columns);
    const imageHeight = columns === 1 ? 620 : 430;
    const cardHeight = imageHeight + captionHeight;
    const rows = Math.ceil(items.length / columns);
    const messagePadding = 34;
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    tempContext.font = "26px Arial";
    const messageLines = wrapText(tempContext, message, width - padding * 2 - messagePadding * 2);
    const messageHeight = messagePadding * 2 + 42 + messageLines.length * 34;
    const height = padding + headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap + gap + messageHeight + padding;
    const pixelRatio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = "#111111";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#c7a15a";
    context.font = "700 42px Arial";
    context.fillText("Pedido de quadros", padding, padding + 46);
    context.fillStyle = "#ffffff";
    context.font = "24px Arial";
    context.fillText(`${items.length} ${items.length === 1 ? "item" : "itens"} no carrinho`, padding, padding + 84);

    items.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = padding + col * (cardWidth + gap);
      const y = padding + headerHeight + row * (cardHeight + gap);

      context.fillStyle = "#ffffff";
      context.fillRect(x, y, cardWidth, imageHeight);
      drawFittedImage(context, item.image, x, y, cardWidth, imageHeight);

      context.fillStyle = "#191919";
      context.fillRect(x, y + imageHeight, cardWidth, captionHeight);
      context.fillStyle = "#c7a15a";
      context.font = columns === 1 ? "700 40px Arial" : "700 34px Arial";
      context.fillText(`#${item.code}`, x + 28, y + imageHeight + 48);

      const subtitle = item.title && item.title !== item.code ? item.title : item.category || "";
      const detail = item.category && subtitle !== item.category ? item.category : "";
      context.fillStyle = "#ffffff";
      context.font = columns === 1 ? "23px Arial" : "20px Arial";
      if (subtitle) context.fillText(subtitle, x + 28, y + imageHeight + 82);
      if (detail) {
        context.fillStyle = "#b7b7b7";
        context.font = columns === 1 ? "20px Arial" : "18px Arial";
        context.fillText(detail, x + 28, y + imageHeight + 106);
      }
    });

    const messageY = padding + headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap + gap;
    context.fillStyle = "#f7f3ec";
    context.fillRect(padding, messageY, width - padding * 2, messageHeight);
    context.fillStyle = "#111111";
    context.font = "700 30px Arial";
    context.fillText("Mensagem", padding + messagePadding, messageY + messagePadding + 28);
    context.font = "26px Arial";
    messageLines.forEach((line, index) => {
      if (!line) return;
      context.fillText(line, padding + messagePadding, messageY + messagePadding + 78 + index * 34);
    });

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
        const orderImageBlob = await createOrderImage(message);
        const messageBlob = new Blob([message], { type: "text/plain" });
        await navigator.clipboard.write([new ClipboardItem({ "image/png": orderImageBlob, "text/plain": messageBlob })]);
        setCopied("order");
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
                      <Check size={13} /> {copied === "order" ? "Pedido completo copiado" : "Mensagem copiada"}
                    </>
                  ) : (
                    <>
                      <ClipboardCopy size={13} /> Copiar pedido completo
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
