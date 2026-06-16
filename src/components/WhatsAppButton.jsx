import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ClipboardCopy, ShoppingCart, X, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const LOGO_URL = `${import.meta.env.BASE_URL}logo-if-branca.png`;
const REQUEST_TEXT = "Ola! Tenho interesse nos quadros selecionados. Pode me enviar valores, tamanhos e opcoes de moldura e material disponiveis?";
const CATEGORY_BY_PREFIX = {
  AFM: "Abstrato Fluido e Marmore",
  ANI: "Animais",
  APA: "Abstrato Pintura e Aquarela",
  FOL: "Flores e Folhas",
  MAR: "Mar e Praia",
  NAT: "Natureza",
  PON: "Pontes",
  SIMU: "Espelhos",
  URB: "Urbano",
  VID: "Vida",
};

const getCodePrefix = (code) =>
  String(code || "")
    .replace(/^#+/, "")
    .split(/[_-]/)[0]
    .toUpperCase();

const getItemCategory = (item) => {
  const explicitCategory = String(item?.category || item?.category_name || "").trim();
  if (explicitCategory) return explicitCategory;
  return CATEGORY_BY_PREFIX[getCodePrefix(item?.code)] || "";
};

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
        const categoryName = getItemCategory(item);
        const category = categoryName ? ` (${categoryName})` : "";
        return `- #${item.code}${title}${category}`;
      })
      .join("\n");

    return `Ola, tudo bem? Tenho interesse nestes quadros:\n\n${lines}\n\n${REQUEST_TEXT}`;
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

  const truncateText = (context, text, maxWidth) => {
    const value = String(text || "").trim();
    if (!value || context.measureText(value).width <= maxWidth) return value;

    let truncated = value;
    while (truncated.length > 0 && context.measureText(`${truncated}...`).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated ? `${truncated}...` : "";
  };

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const escapeHtml = (value) =>
    String(value || "").replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[char] || char;
    });

  const buildClipboardHtml = (imageDataUrl, message) => {
    const htmlMessage = escapeHtml(message).replace(/\n/g, "<br>");
    return `<div><img src="${imageDataUrl}" alt="Imagem Fit Quadros - pedido" /><br><p>${htmlMessage}</p></div>`;
  };

  const createOrderImage = async () => {
    const [logo, items] = await Promise.all([
      loadImage(LOGO_URL),
      Promise.all(
        cart.map(async (item) => ({
          ...item,
          image: await loadImage(item.image_url),
        })),
      ),
    ]);

    const columns = items.length === 1 ? 1 : items.length === 2 ? 2 : 3;
    const width = columns === 1 ? 760 : columns === 2 ? 900 : 1020;
    const padding = 38;
    const gap = 22;
    const headerHeight = 122;
    const cardPadding = 12;
    const captionHeight = 88;
    const cardWidth = Math.floor((width - padding * 2 - gap * (columns - 1)) / columns);
    const imageHeight = columns === 1 ? 440 : columns === 2 ? 280 : 205;
    const cardHeight = imageHeight + captionHeight + cardPadding * 2;
    const rows = Math.ceil(items.length / columns);
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    tempContext.font = "19px Arial";
    const footerLines = wrapText(tempContext, REQUEST_TEXT, width - padding * 2 - 58);
    const footerHeight = footerLines.length * 27 + 84;
    const height = padding + headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap + gap + footerHeight + padding;
    const pixelRatio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = "#111111";
    context.fillRect(0, 0, width, height);

    const logoHeight = 58;
    const logoWidth = logo ? Math.round((logo.width / logo.height) * logoHeight) : 0;
    if (logo) {
      context.drawImage(logo, padding, padding - 2, logoWidth, logoHeight);
    }

    const brandX = logo ? padding + logoWidth + 18 : padding;
    context.fillStyle = "#c7a15a";
    context.font = "700 28px Arial";
    context.fillText("Imagem Fit Quadros", brandX, padding + 30);
    context.fillStyle = "#ffffff";
    context.font = "16px Arial";
    context.fillText("Selecao de quadros para orcamento", brandX, padding + 57);

    const summaryText = `${items.length} ${items.length === 1 ? "quadro" : "quadros"}`;
    context.font = "700 15px Arial";
    const summaryWidth = context.measureText(summaryText).width + 30;
    context.strokeStyle = "#c7a15a";
    context.lineWidth = 1;
    context.strokeRect(width - padding - summaryWidth, padding + 10, summaryWidth, 34);
    context.fillStyle = "#c7a15a";
    context.fillText(summaryText, width - padding - summaryWidth + 15, padding + 32);

    items.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = padding + col * (cardWidth + gap);
      const y = padding + headerHeight + row * (cardHeight + gap);
      const imageX = x + cardPadding;
      const imageY = y + cardPadding;
      const imageWidth = cardWidth - cardPadding * 2;

      context.fillStyle = "#f4efe5";
      context.fillRect(x, y, cardWidth, cardHeight);
      context.strokeStyle = "#d7c7a5";
      context.lineWidth = 1;
      context.strokeRect(x + 0.5, y + 0.5, cardWidth - 1, cardHeight - 1);
      context.fillStyle = "#ffffff";
      context.fillRect(imageX, imageY, imageWidth, imageHeight);
      drawFittedImage(context, item.image, imageX, imageY, imageWidth, imageHeight);

      const captionY = y + cardPadding + imageHeight;
      context.fillStyle = "#111111";
      context.font = columns === 1 ? "700 32px Arial" : columns === 2 ? "700 27px Arial" : "700 22px Arial";
      const codeText = truncateText(context, `#${item.code}`, cardWidth - 28);
      context.fillText(codeText, x + 14, captionY + 36);

      const label = getItemCategory(item) || (item.title && item.title !== item.code ? item.title : "");
      context.fillStyle = "#5f5f5f";
      context.font = columns === 1 ? "20px Arial" : columns === 2 ? "17px Arial" : "14px Arial";
      const labelText = truncateText(context, label, cardWidth - 28);
      if (labelText) context.fillText(labelText, x + 14, captionY + 62);
    });

    const footerY = padding + headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap + gap;
    context.fillStyle = "#f4efe5";
    context.fillRect(padding, footerY, width - padding * 2, footerHeight);
    context.fillStyle = "#c7a15a";
    context.fillRect(padding, footerY, 8, footerHeight);
    context.fillStyle = "#111111";
    context.font = "700 18px Arial";
    context.fillText("Mensagem para orcamento", padding + 28, footerY + 34);
    context.fillStyle = "#303030";
    context.font = "19px Arial";
    footerLines.forEach((line, index) => {
      if (!line) return;
      context.fillText(line, padding + 28, footerY + 66 + index * 27);
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
        const orderImageBlob = await createOrderImage();
        const messageBlob = new Blob([message], { type: "text/plain" });
        const imageDataUrl = await blobToDataUrl(orderImageBlob);
        const htmlBlob = new Blob([buildClipboardHtml(imageDataUrl, message)], { type: "text/html" });
        await navigator.clipboard.write([new ClipboardItem({ "text/html": htmlBlob, "image/png": orderImageBlob, "text/plain": messageBlob })]);
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
