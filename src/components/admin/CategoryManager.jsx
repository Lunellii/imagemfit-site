import { useMemo, useState } from "react";
import { Plus, Trash2, Loader2, ImageIcon } from "lucide-react";
import { localClient } from "@/api/localClient";
import { useToast } from "@/components/ui/use-toast";

export default function CategoryManager({ categories, images = [], onChanged }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverEnabled, setCoverEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const { toast } = useToast();

  const imagesCountByCategory = useMemo(() => {
    return images.reduce((acc, img) => {
      acc[img.category_id] = (acc[img.category_id] || 0) + 1;
      return acc;
    }, {});
  }, [images]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      setCreating(true);

      await localClient.entities.Category.create({
        name: name.trim(),
        description: description.trim(),
        cover_enabled: coverEnabled,
        order: categories.length
      });

      setName("");
      setDescription("");
      setCoverEnabled(true);
      toast({ title: "Categoria criada!" });
      onChanged();
    } catch (_err) {
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCover = async (cat) => {
    try {
      setTogglingId(cat.id);
      const next = !(cat.cover_enabled ?? true);
      await localClient.entities.Category.update(cat.id, { cover_enabled: next });
      toast({ title: next ? "Capa ativada" : "Capa desativada", description: cat.name });
      onChanged();
    } catch (_err) {
      toast({ title: "Erro ao atualizar capa da categoria", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (cat) => {
    try {
      setDeletingId(cat.id);
      await localClient.entities.Category.delete(cat.id);
      toast({ title: "Categoria removida", description: cat.name });
      onChanged();
    } catch (_err) {
      toast({ title: "Erro ao remover categoria", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="border border-border p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-white">Nova Categoria</h3>

        <div className="space-y-1.5">
          <label className="text-white/50 text-xs tracking-widest uppercase">Nome *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Natureza, Abstrato, Espelhos..."
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3 text-sm outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-white/50 text-xs tracking-widest uppercase">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional..."
            className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3 text-sm outline-none focus:border-gold transition-colors"
          />
        </div>

        <label className="flex items-center justify-between gap-3 border border-border bg-card px-4 py-3">
          <div>
            <p className="text-white text-sm font-medium">Capa automática</p>
            <p className="text-white/50 text-xs">A categoria usa rotação das imagens como capa no site.</p>
          </div>
          <input
            type="checkbox"
            checked={coverEnabled}
            onChange={(e) => setCoverEnabled(e.target.checked)}
            className="h-4 w-4 accent-[#c7a15a]"
          />
        </label>

        <button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className="w-full bg-gold text-black py-3 text-xs tracking-widest uppercase font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />}
          {creating ? "Criando..." : "Criar Categoria"}
        </button>
      </div>

      <div className="border border-border p-6">
        <h3 className="font-heading text-lg font-semibold text-white mb-5">Categorias ({categories.length})</h3>
        {categories.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">Nenhuma categoria criada ainda.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map((cat) => {
              const imageCount = imagesCountByCategory[cat.id] || 0;
              const isCoverOn = cat.cover_enabled ?? true;
              const isBusy = togglingId === cat.id;

              return (
                <div key={cat.id} className="p-3.5 bg-card border border-border hover:border-gold/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-medium">{cat.name}</p>
                      {cat.description && <p className="text-white/40 text-xs">{cat.description}</p>}
                      <p className="text-white/35 text-xs mt-1 flex items-center gap-1.5">
                        <ImageIcon size={12} />
                        {imageCount} imagem(ns) nesta categoria
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleCover(cat)}
                        disabled={isBusy}
                        className={`text-[10px] px-2.5 py-1 border uppercase tracking-wider transition-colors ${
                          isCoverOn ? "border-gold/70 text-gold hover:bg-gold hover:text-black" : "border-white/20 text-white/50 hover:border-gold/50 hover:text-gold"
                        } disabled:opacity-50`}
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isCoverOn ? "Capa ativa" : "Capa inativa"}
                      </button>
                      <button onClick={() => handleDelete(cat)} className="text-white/30 hover:text-destructive transition-colors">
                        {deletingId === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
