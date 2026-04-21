import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { localClient } from "@/api/localClient";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_FORM = {
  paused: false,
  headline: "Catalogo em curadoria",
  message: "Estamos preparando uma selecao especial de quadros. Volte em instantes.",
  cta_label: "Falar no WhatsApp",
  cta_url: "https://wa.me/5547999273809"
};

const normalizeForm = (value = {}) => ({
  paused: Boolean(value?.paused),
  headline: String(value?.headline || DEFAULT_FORM.headline),
  message: String(value?.message || DEFAULT_FORM.message),
  cta_label: String(value?.cta_label || DEFAULT_FORM.cta_label),
  cta_url: String(value?.cta_url || DEFAULT_FORM.cta_url)
});

export default function SiteModeManager({ initialState, onChanged }) {
  const [form, setForm] = useState(() => normalizeForm(initialState));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(normalizeForm(initialState));
  }, [initialState]);

  const previewLabel = useMemo(() => (form.paused ? "Modo pausa ativo" : "Site aberto"), [form.paused]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await localClient.siteState.update(form);
      toast({
        title: "Operacao atualizada",
        description: form.paused ? "Tela especial ativa para visitantes." : "Site publico liberado normalmente."
      });
      onChanged?.();
    } catch (_error) {
      toast({
        title: "Erro ao salvar operacao",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
      <div className="border border-border p-6 space-y-5">
        <h3 className="font-heading text-lg font-semibold text-white">Operacao do Site</h3>
        <p className="text-white/45 text-sm">Ative uma tela temporaria para visitantes enquanto voce organiza o catalogo.</p>

        <label className="flex items-center justify-between gap-3 border border-border bg-card px-4 py-3">
          <div>
            <p className="text-white text-sm font-medium">Ativar modo pausa</p>
            <p className="text-white/50 text-xs">Nao usa o termo manutencao. Mostra uma mensagem personalizada.</p>
          </div>
          <input
            type="checkbox"
            checked={form.paused}
            onChange={(event) => setForm((current) => ({ ...current, paused: event.target.checked }))}
            className="h-4 w-4 accent-[#c7a15a]"
          />
        </label>

        <div className="space-y-1.5">
          <label className="text-white/50 text-xs tracking-widest uppercase">Titulo da tela</label>
          <input
            value={form.headline}
            onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value.slice(0, 120) }))}
            className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3 text-sm outline-none focus:border-gold transition-colors"
            placeholder="Ex: Curadoria em andamento"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-white/50 text-xs tracking-widest uppercase">Mensagem</label>
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value.slice(0, 260) }))}
            className="w-full min-h-[110px] resize-y bg-card border border-border text-white placeholder-white/30 px-4 py-3 text-sm outline-none focus:border-gold transition-colors"
            placeholder="Mensagem curta para o visitante."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs tracking-widest uppercase">Texto do botao</label>
            <input
              value={form.cta_label}
              onChange={(event) => setForm((current) => ({ ...current, cta_label: event.target.value.slice(0, 40) }))}
              className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50 text-xs tracking-widest uppercase">URL do botao</label>
            <input
              value={form.cta_url}
              onChange={(event) => setForm((current) => ({ ...current, cta_url: event.target.value.slice(0, 260) }))}
              className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gold text-black py-3 text-xs tracking-widest uppercase font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />}
          {saving ? "Salvando..." : "Salvar Operacao"}
        </button>
      </div>

      <div className="border border-border p-6 bg-card/40">
        <span className="text-gold text-[11px] tracking-[0.32em] uppercase">{previewLabel}</span>
        <h4 className="font-heading text-3xl text-white mt-3">{form.headline}</h4>
        <p className="text-white/65 text-sm mt-3 leading-relaxed">{form.message}</p>
        <a
          href={form.cta_url || "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center mt-6 border border-gold/60 text-gold px-5 py-2 text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-black transition-colors"
        >
          {form.cta_label || "Contato"}
        </a>
      </div>
    </div>
  );
}
