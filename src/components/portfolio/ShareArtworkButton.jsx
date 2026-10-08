import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { createArtworkFile, downloadArtwork } from "@/utils/shareArtwork";

export default function ShareArtworkButton({ image, className = "", compact = false }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async (event) => {
    event.stopPropagation();
    if (sharing) return;
    setSharing(true);
    let file;
    try {
      file = await createArtworkFile(image);
      const shareData = { files: [file], title: `Imagem Fit #${image.code}` };
      if (typeof navigator.share === "function" && (typeof navigator.canShare !== "function" || navigator.canShare(shareData))) {
        await navigator.share(shareData);
      } else {
        downloadArtwork(file);
        toast({ title: "Imagem com código salva", description: "Agora você pode enviá-la pelo aplicativo que preferir." });
      }
    } catch (error) {
      if (error?.name !== "AbortError" && file) {
        downloadArtwork(file);
        toast({ title: "Imagem com código salva", description: "Agora você pode enviá-la pelo aplicativo que preferir." });
      } else if (error?.name !== "AbortError") {
        toast({ variant: "destructive", title: "Não foi possível compartilhar", description: "Tente novamente em alguns instantes." });
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      type="button"
      data-no-drag="true"
      onClick={handleShare}
      disabled={sharing}
      aria-label={`Compartilhar imagem do quadro ${image.code} com código`}
      className={className || (compact
        ? "flex h-9 min-w-0 items-center justify-center gap-1 border border-gold/45 px-1 text-[9px] font-semibold uppercase tracking-[0.04em] text-gold transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-50"
        : "flex w-full items-center justify-center gap-2 border border-gold/45 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-50")}
    >
      {sharing ? <Loader2 size={compact ? 12 : 15} className="animate-spin" /> : <Share2 size={compact ? 12 : 15} />}
      {compact ? (sharing ? "..." : "Enviar") : (sharing ? "Preparando..." : "Compartilhar")}
    </button>
  );
}
