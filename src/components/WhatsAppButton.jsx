import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ClipboardCopy, ListChecks, Search, Share2, X, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { commercialClient } from "@/api/commercialClient";

const LOGO_URL = `${import.meta.env.BASE_URL}logo-if-branca.png`;
const REQUEST_TEXT = "Gostaria de consultar valores, opções de moldura, materiais disponíveis e prazo para esta seleção.";
const CATEGORY_BY_PREFIX = {
  AFM: "Abstrato Fluido e Mármore",
  ANI: "Animais",
  AEP: "Abstrato Estilo Pintura",
  APA: "Abstrato Estilo Pintura",
  E3D: "Estilo 3D",
  ABR: "Estilo 3D",
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

export default function WhatsAppButton({ onSearch }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false);
  const [preparedOrderImage, setPreparedOrderImage] = useState(null);
  const [preparingOrderImage, setPreparingOrderImage] = useState(false);
  const createOrderImageRef = useRef(null);
  const { cart, removeItem, clearCart } = useCart();

  useEffect(() => {
    const isTouchDevice = window.matchMedia?.("(pointer: coarse)").matches || navigator.maxTouchPoints > 1;
    let canShareFiles = typeof navigator.canShare !== "function";

    if (typeof navigator.canShare === "function" && typeof File !== "undefined") {
      const testFile = new File([new Blob(["test"], { type: "image/png" })], "selecao.png", { type: "image/png" });
      canShareFiles = navigator.canShare({ files: [testFile] });
    }

    setNativeShareAvailable(Boolean(isTouchDevice && navigator.share && canShareFiles));
  }, []);

  const absoluteUrl = (src) => {
    try {
      return src ? new URL(src, window.location.origin).href : "";
    } catch {
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
        const size = item.size ? ` · Tamanho: ${item.size}` : "";
        return `- #${item.code}${title}${category}${size}`;
      })
      .join("\n");

    return `Olá, tudo bem? Separei estes produtos no catálogo da Imagem Fit:\n\n${lines}\n\n${REQUEST_TEXT}`;
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
      } catch {
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
      context.fillText("Imagem indisponível", x + width / 2, y + height / 2);
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
    const captionHeight = 104;
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
    context.fillText("Códigos selecionados para orçamento", brandX, padding + 57);

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
      context.fillText(codeText, x + 14, captionY + 32);

      const label = getItemCategory(item) || (item.title && item.title !== item.code ? item.title : "");
      context.fillStyle = "#5f5f5f";
      context.font = columns === 1 ? "20px Arial" : columns === 2 ? "17px Arial" : "14px Arial";
      const labelText = truncateText(context, label, cardWidth - 28);
      if (labelText) context.fillText(labelText, x + 14, captionY + 55);
      if (item.size) {
        context.fillStyle = "#9b742b";
        context.font = columns === 1 ? "700 18px Arial" : columns === 2 ? "700 15px Arial" : "700 13px Arial";
        const sizeText = truncateText(context, `Tamanho: ${item.size}`, cardWidth - 28);
        context.fillText(sizeText, x + 14, captionY + 79);
      }
    });

    const footerY = padding + headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap + gap;
    context.fillStyle = "#f4efe5";
    context.fillRect(padding, footerY, width - padding * 2, footerHeight);
    context.fillStyle = "#c7a15a";
    context.fillRect(padding, footerY, 8, footerHeight);
    context.fillStyle = "#111111";
    context.font = "700 18px Arial";
    context.fillText("Pedido de orçamento", padding + 28, footerY + 34);
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

  createOrderImageRef.current = createOrderImage;
  const cartSignature = cart.map((item) => `${item.id}:${item.code}:${item.image_url || ""}:${item.size || ""}`).join("|");
  const preparedImageBlob = preparedOrderImage?.signature === cartSignature ? preparedOrderImage.blob : null;

  useEffect(() => {
    if (!cartSignature) {
      setPreparedOrderImage(null);
      setPreparingOrderImage(false);
      return undefined;
    }

    let active = true;
    setPreparingOrderImage(true);

    createOrderImageRef.current()
      .then((blob) => {
        if (active) setPreparedOrderImage({ signature: cartSignature, blob });
      })
      .catch(() => {
        if (active) setPreparedOrderImage(null);
      })
      .finally(() => {
        if (active) setPreparingOrderImage(false);
      });

    return () => {
      active = false;
    };
  }, [cartSignature]);

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

  const downloadOrderImage = (orderImageBlob) => {
    const imageUrl = URL.createObjectURL(orderImageBlob);
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "imagem-fit-quadros.png";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
  };

  const tryNativeShare = async (message, orderImageBlob) => {
    if (!nativeShareAvailable || typeof navigator.share !== "function" || typeof File === "undefined") {
      return false;
    }

    const file = new File([orderImageBlob], "imagem-fit-quadros.png", { type: "image/png" });
    const shareData = {
      title: "Imagem Fit Quadros",
      text: message,
      files: [file],
    };
    const fileOnlyShareData = {
      title: "Imagem Fit Quadros",
      files: [file],
    };

    if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
      if (!navigator.canShare(fileOnlyShareData)) {
        return false;
      }

      await navigator.clipboard?.writeText?.(message).catch(() => {});
      await navigator.share(fileOnlyShareData);
      setCopied("sharedImage");
      return true;
    }

    await navigator.share(shareData);
    setCopied("shared");
    return true;
  };

  const handleCopy = async () => {
    const message = buildMessage();
    if (!message) return;
    commercialClient.analytics.track("share_selection");
    let orderImageBlob = preparedImageBlob;

    try {
      orderImageBlob = orderImageBlob || (await createOrderImage());
      const shared = await tryNativeShare(message, orderImageBlob);
      if (shared) {
        window.setTimeout(() => setCopied(""), 2500);
        return;
      }

      if (navigator.clipboard?.write && window.ClipboardItem) {
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
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (orderImageBlob) {
        downloadOrderImage(orderImageBlob);
        setCopied("downloaded");
      }
      fallbackCopy(message);
      if (!orderImageBlob) setCopied("text");
    }

    window.setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:left-auto sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mx-4 w-[calc(100vw-2rem)] overflow-hidden border border-line bg-white font-sans text-ink shadow-[0_24px_60px_-24px_rgba(23,22,20,0.45)] sm:mx-0 sm:w-[22rem]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="font-display text-lg font-semibold">Minha seleção ({cart.length})</span>
              <button onClick={() => setOpen(false)} className="text-stone hover:text-ink" aria-label="Fechar seleção">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="px-6 py-10 text-center leading-relaxed text-stone">Sua seleção está vazia. Toque em “Selecionar” nos quadros que quiser compartilhar.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                      {item.image_url && <img src={item.image_url} alt={item.code} className="h-14 w-14 flex-shrink-0 object-cover" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.code}</p>
                        {item.category && <p className="text-sm text-stone">{item.category}</p>}
                        {item.size && <p className="text-sm text-brass">Tamanho: {item.size}</p>}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="flex-shrink-0 p-2 text-stone transition-colors hover:text-red-700" aria-label={`Remover ${item.code}`}>
                        <Trash2 size={17} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 border-t border-line p-5">
                <button
                  onClick={handleCopy}
                  disabled={nativeShareAvailable && preparingOrderImage}
                  className="flex w-full items-center justify-center gap-2 bg-ink py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-brass disabled:cursor-wait disabled:opacity-55"
                >
                  {nativeShareAvailable && preparingOrderImage ? (
                    <>Preparando imagem...</>
                  ) : copied ? (
                    <>
                      <Check size={13} />{" "}
                      {copied === "order"
                        ? "Imagem e códigos copiados"
                        : copied === "downloaded"
                          ? "Imagem baixada e mensagem copiada"
                          : copied === "shared"
                            ? "Imagem e códigos enviados"
                            : copied === "sharedImage"
                              ? "Imagem compartilhada e texto copiado"
                              : copied === "sharedText"
                                ? "Mensagem compartilhada"
                                : "Mensagem copiada"}
                    </>
                  ) : nativeShareAvailable ? (
                    <>
                    <Share2 size={13} /> Finalizar e compartilhar
                    </>
                  ) : (
                    <>
                    <ClipboardCopy size={13} /> Copiar imagem e códigos
                    </>
                  )}
                </button>
                <p className="text-center text-sm leading-relaxed text-stone">
                  {nativeShareAvailable ? "Escolha o aplicativo e o contato que deve receber a seleção." : "Depois de copiar, abra a conversa desejada e cole a seleção."}
                </p>
                <button onClick={clearCart} className="flex w-full items-center justify-center gap-2 py-1 text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">
                  Limpar seleção
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Fechar minha seleção" : "Abrir minha seleção"}
        className="relative hidden items-center gap-2.5 bg-ink px-5 py-3.5 font-sans text-sm font-semibold text-paper shadow-[0_14px_30px_-12px_rgba(23,22,20,0.6)] transition-colors hover:bg-brass sm:flex"
      >
        {open ? <X size={18} /> : <ListChecks size={18} />}
        Minha seleção
        {!open && cart.length > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1.5 text-xs font-bold text-ink">{cart.length}</span>
        ) : null}
      </motion.button>

      <div className="grid h-16 w-full grid-cols-2 border-t border-line bg-paper/97 font-sans text-ink backdrop-blur-md sm:hidden">
        <button type="button" onClick={onSearch} className="flex items-center justify-center gap-2 text-sm font-semibold text-stone">
          <Search size={18} /> Buscar
        </button>
        <button type="button" onClick={() => setOpen(!open)} className={`flex items-center justify-center gap-2 border-l border-line text-sm font-semibold transition-colors ${open ? "bg-ink text-paper" : "text-ink"}`}>
          {open ? <X size={18} /> : <ListChecks size={18} />}
          Minha seleção
          {!open && cart.length > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs font-bold text-paper">{cart.length}</span> : null}
        </button>
      </div>
    </div>
  );
}
