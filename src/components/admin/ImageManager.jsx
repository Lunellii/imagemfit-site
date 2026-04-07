import { Trash2, Loader2, CheckSquare, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { localClient } from "@/api/localClient";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function ImageManager({ images, categories, onDeleted }) {
  const [deleting, setDeleting] = useState(null);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState(null);
  const { toast } = useToast();

  const getCategoryName = (catId) => categories.find((c) => c.id === catId)?.name || "—";

  const filtered = useMemo(() => (filterCat ? images.filter((i) => i.category_id === filterCat) : images), [filterCat, images]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedFilteredCount = filtered.filter((img) => selectedIdSet.has(img.id)).length;
  const selectedImages = images.filter((img) => selectedIdSet.has(img.id));
  const hasSelection = selectedIds.length > 0;
  const allFilteredSelected = filtered.length > 0 && selectedFilteredCount === filtered.length;

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionAnchorId(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    setSelectionAnchorId(id);
  };

  const selectRange = (targetId) => {
    if (!selectionAnchorId) {
      toggleSelect(targetId);
      return;
    }

    const anchorIndex = filtered.findIndex((img) => img.id === selectionAnchorId);
    const targetIndex = filtered.findIndex((img) => img.id === targetId);

    if (anchorIndex === -1 || targetIndex === -1) {
      toggleSelect(targetId);
      return;
    }

    const [from, to] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
    const rangeIds = filtered.slice(from, to + 1).map((img) => img.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
    setSelectionAnchorId(targetId);
  };

  const handleSelectClick = (id, event) => {
    if (event.shiftKey) {
      selectRange(id);
      return;
    }
    toggleSelect(id);
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filtered.map((img) => img.id);
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDelete = async (img) => {
    try {
      setDeleting(img.id);
      await localClient.entities.PortfolioImage.delete(img.id);
      setSelectedIds((prev) => prev.filter((id) => id !== img.id));
      setSelectionAnchorId((prev) => (prev === img.id ? null : prev));
      toast({ title: "Imagem removida", description: `#${img.code}` });
      onDeleted();
    } catch (_err) {
      toast({ title: "Erro ao remover imagem", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedImages.length) return;
    try {
      setDeletingBulk(true);
      for (const img of selectedImages) {
        await localClient.entities.PortfolioImage.delete(img.id);
      }
      const removedCount = selectedImages.length;
      clearSelection();
      toast({
        title: "Imagens removidas",
        description: `${removedCount} imagem(ns) excluída(s) com sucesso.`
      });
      onDeleted();
    } catch (_err) {
      toast({ title: "Erro ao excluir imagens selecionadas", variant: "destructive" });
    } finally {
      setDeletingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFilterCat("")}
          className={`text-xs px-4 py-2 border tracking-widest uppercase transition-colors ${
            !filterCat ? "border-gold text-gold" : "border-border text-white/40 hover:border-white/40"
          }`}
        >
          Todos ({images.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`text-xs px-4 py-2 border tracking-widest uppercase transition-colors ${
              filterCat === cat.id ? "border-gold text-gold" : "border-border text-white/40 hover:border-white/40"
            }`}
          >
            {cat.name} ({images.filter((i) => i.category_id === cat.id).length})
          </button>
        ))}
      </div>

      <div className="border border-border bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-white/65 tracking-wide">
          {hasSelection ? (
            <span>
              {selectedIds.length} imagem(ns) selecionada(s)
              {selectedFilteredCount > 0 ? ` neste filtro: ${selectedFilteredCount}` : ""}
            </span>
          ) : (
            <span>Selecione imagens para excluir em lote (Shift + clique seleciona intervalo)</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSelectAllFiltered}
            disabled={!filtered.length}
            className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 border border-border text-white/70 hover:border-gold/60 hover:text-gold transition-colors disabled:opacity-40"
          >
            {allFilteredSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {allFilteredSelected ? "Desmarcar filtro" : "Selecionar filtro"}
          </button>

          <button
            onClick={clearSelection}
            disabled={!hasSelection}
            className="text-[11px] px-3 py-2 border border-border text-white/60 hover:border-white/60 hover:text-white transition-colors disabled:opacity-40"
          >
            Limpar seleção
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={!hasSelection || deletingBulk}
                className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 border border-destructive/70 text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-40"
              >
                {deletingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir selecionadas
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Excluir imagens selecionadas?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/50">
                  Você vai remover <strong className="text-gold">{selectedImages.length}</strong> imagem(ns) permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-none border-border">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} className="rounded-none bg-destructive">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {!filtered.length ? (
        <div className="border border-border p-12 text-center">
          <p className="text-white/30 text-sm">Nenhuma imagem encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((img) => {
            const isSelected = selectedIdSet.has(img.id);
            return (
              <div
                key={img.id}
                className={`group border overflow-hidden bg-card transition-colors ${
                  isSelected ? "border-gold" : "border-border"
                }`}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={img.image_url} alt={img.code} className="w-full h-full object-cover" />
                  <button
                    onClick={(event) => handleSelectClick(img.id, event)}
                    className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center border backdrop-blur-sm transition-colors ${
                      isSelected
                        ? "bg-gold text-black border-gold"
                        : "bg-black/50 text-white/70 border-white/30 hover:border-gold/60 hover:text-gold"
                    }`}
                    aria-label={isSelected ? `Desmarcar ${img.code}` : `Selecionar ${img.code}`}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-gold truncate">#{img.code}</p>
                    <p className="text-xs text-white/40 truncate">{getCategoryName(img.category_id)}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="flex-shrink-0 text-white/30 hover:text-destructive transition-colors pt-0.5">
                        {deleting === img.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Excluir imagem?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/50">
                          A imagem <strong className="text-gold">#{img.code}</strong> será removida permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none border-border">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(img)} className="rounded-none bg-destructive">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
