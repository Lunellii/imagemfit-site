import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ClipboardCopy, ListChecks, MessageCircle, Search, Share2, X, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { commercialClient } from "@/api/commercialClient";
import { createSelectionImage } from "@/utils/selectionImage";

const WHATSAPP_NUMBER = "5547999273809";
const REQUEST_TEXT = "Gostaria de consultar valores, opções de moldura, materiais disponíveis e prazo para esta seleção.";
const NOTICE_TEXT = "Estou ciente de que as imagens são ilustrativas e que cores e detalhes podem ter pequenas alterações após a impressão.";
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
  const [desktopHint, setDesktopHint] = useState(null);
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

    return `Olá, tudo bem? Separei estes produtos no catálogo da Imagem Fit:\n\n${lines}\n\n${REQUEST_TEXT}\n\n${NOTICE_TEXT}`;
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

  const createOrderImage = () =>
    createSelectionImage(
      cart.map((item) => ({
        image_url: item.image_url,
        code: item.code,
        label: getItemCategory(item) || (item.title && item.title !== item.code ? item.title : ""),
        size: item.size,
      })),
      REQUEST_TEXT,
    );

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

  useEffect(() => {
    setDesktopHint(null);
  }, [cartSignature, open]);

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

  const whatsappUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Celular: a folha de compartilhamento leva imagem + texto juntos.
  // Computador: o WhatsApp Web só aceita colar a imagem, então ela vai para a área de
  // transferência e a conversa abre com o texto já digitado; basta colar (Ctrl+V) e enviar.
  const handleSend = async () => {
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

      let imageCopied = false;
      if (navigator.clipboard?.write && window.ClipboardItem) {
        imageCopied = await navigator.clipboard
          .write([new ClipboardItem({ "image/png": orderImageBlob })])
          .then(() => true)
          .catch(() => false);
      }
      if (!imageCopied) downloadOrderImage(orderImageBlob);
      const url = whatsappUrl(message);
      window.open(url, "_blank", "noopener");
      setDesktopHint({ url, downloaded: !imageCopied });
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (orderImageBlob) downloadOrderImage(orderImageBlob);
      fallbackCopy(message);
      setCopied(orderImageBlob ? "downloaded" : "text");
      window.setTimeout(() => setCopied(""), 2500);
    }
  };

  // Para mandar a seleção a outra pessoa: copia imagem e texto sem abrir conversa.
  const handleCopyOnly = async () => {
    const message = buildMessage();
    if (!message) return;
    let orderImageBlob = preparedImageBlob;

    try {
      orderImageBlob = orderImageBlob || (await createOrderImage());
      if (navigator.clipboard?.write && window.ClipboardItem) {
        const messageBlob = new Blob([message], { type: "text/plain" });
        const imageDataUrl = await blobToDataUrl(orderImageBlob);
        const htmlBlob = new Blob([buildClipboardHtml(imageDataUrl, message)], { type: "text/html" });
        await navigator.clipboard.write([new ClipboardItem({ "text/html": htmlBlob, "image/png": orderImageBlob, "text/plain": messageBlob })]);
        setCopied("order");
      } else {
        fallbackCopy(message);
        setCopied("text");
      }
    } catch {
      if (orderImageBlob) downloadOrderImage(orderImageBlob);
      fallbackCopy(message);
      setCopied(orderImageBlob ? "downloaded" : "text");
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
            className="mx-4 w-[calc(100vw-2rem)] overflow-hidden border border-gold/30 bg-[#1c1c1c] shadow-2xl sm:mx-0 sm:w-80"
          >
            <div className="bg-gold px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks size={16} className="text-black" />
                <span className="text-black font-semibold text-sm">Minha seleção ({cart.length})</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-black/60 hover:text-black">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm leading-relaxed text-white/55">Sua seleção ainda está vazia. Adicione os quadros que deseja compartilhar.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {item.image_url && <img src={item.image_url} alt={item.code} className="w-10 h-10 object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-gold font-mono text-xs font-semibold">#{item.code}</p>
                        {item.title && item.title !== item.code && <p className="text-white/50 text-xs truncate">{item.title}</p>}
                        {item.category && <p className="text-white/30 text-xs">{item.category}</p>}
                        {item.size && <p className="mt-1 text-xs font-semibold text-gold/80">Tamanho: {item.size}</p>}
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
                {desktopHint && (
                  <div className="border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed text-white/80">
                    <p className="font-semibold text-gold">
                      {desktopHint.downloaded ? "Imagem salva nos downloads" : "Imagem copiada!"}
                    </p>
                    <p className="mt-1">
                      {desktopHint.downloaded
                        ? "Na conversa do WhatsApp que abrimos, arraste a imagem baixada para dentro e envie junto com o texto."
                        : "Na conversa do WhatsApp que abrimos, aperte Ctrl+V para anexar a imagem e envie junto com o texto."}
                    </p>
                    <a href={desktopHint.url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-gold underline underline-offset-2">
                      Abrir a conversa de novo
                    </a>
                  </div>
                )}
                <button
                  onClick={handleSend}
                  disabled={preparingOrderImage}
                  className="flex w-full items-center justify-center gap-2 bg-gold py-3 text-xs font-semibold uppercase tracking-widest text-black transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-55"
                >
                  {preparingOrderImage ? (
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
                              : "Mensagem copiada"}
                    </>
                  ) : nativeShareAvailable ? (
                    <>
                      <Share2 size={13} /> Finalizar e compartilhar
                    </>
                  ) : (
                    <>
                      <MessageCircle size={14} /> Enviar pelo WhatsApp
                    </>
                  )}
                </button>
                <p className="px-2 text-center text-[10px] leading-relaxed text-white/40">
                  {nativeShareAvailable
                    ? "Escolha o WhatsApp e depois o contato que deve receber a seleção."
                    : "Abrimos a conversa com a Imagem Fit com o texto pronto. A imagem fica copiada para você colar."}
                </p>
                {!nativeShareAvailable && (
                  <button
                    onClick={handleCopyOnly}
                    disabled={preparingOrderImage}
                    className="flex w-full items-center justify-center gap-2 border border-gold/40 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-55"
                  >
                    <ClipboardCopy size={13} /> Copiar para outro contato
                  </button>
                )}
                <button onClick={clearCart} className="flex w-full items-center justify-center gap-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40 transition-colors hover:text-red-400">
                  <Trash2 size={13} /> Limpar seleção
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
        className="relative hidden h-14 w-14 items-center justify-center bg-gold shadow-lg transition-colors hover:bg-gold/90 sm:flex"
      >
        {open ? <X size={22} className="text-black" /> : <ListChecks size={22} className="text-black" />}
        {!open && cart.length > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-bold text-white">{cart.length}</span>
        ) : null}
      </motion.button>

      <div className="grid h-16 w-full grid-cols-2 border-t border-white/10 bg-[#111]/98 shadow-2xl backdrop-blur-md sm:hidden">
        <button type="button" onClick={onSearch} className="flex flex-col items-center justify-center gap-1 text-white/60 transition-colors hover:text-gold">
          <Search size={18} />
          <span className="text-[8px] font-semibold uppercase tracking-[0.16em]">Buscar</span>
        </button>
        <button type="button" onClick={() => setOpen(!open)} className={`relative flex flex-col items-center justify-center gap-1 border-l border-white/10 transition-colors ${open ? "bg-gold text-black" : "text-white/60 hover:text-gold"}`}>
          {open ? <X size={18} /> : <ListChecks size={18} />}
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">Minha seleção</span>
          {!open && cart.length > 0 ? <span className="absolute right-[28%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[8px] font-bold text-black">{cart.length}</span> : null}
        </button>
      </div>
    </div>
  );
}
