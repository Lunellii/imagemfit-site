import { useEffect, useState } from "react";
import { BarChart3, Check, Clock3, Eye, ListPlus, Loader2, MessageCircle, RefreshCw, Share2, Trash2, Users } from "lucide-react";
import { commercialClient } from "@/api/commercialClient";
import { useToast } from "@/components/ui/use-toast";

const statusLabel = {
  new: "Novo",
  contacted: "Atendido",
  archived: "Arquivado"
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
};

const whatsappHref = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  const international = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${international}`;
};

export default function CommercialDashboard() {
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [leadItems, summary] = await Promise.all([
        commercialClient.leads.list(),
        commercialClient.analytics.summary(30)
      ]);
      setLeads(Array.isArray(leadItems) ? leadItems : []);
      setAnalytics(summary || null);
    } catch {
      toast({ title: "Não foi possível carregar os dados comerciais.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const updated = await commercialClient.leads.update(id, { status });
      setLeads((items) => items.map((item) => (item.id === id ? updated : item)));
    } catch {
      toast({ title: "Não foi possível atualizar o contato.", variant: "destructive" });
    }
  };

  const removeLead = async (id) => {
    if (!window.confirm("Excluir este contato do painel?")) return;
    try {
      await commercialClient.leads.delete(id);
      setLeads((items) => items.filter((item) => item.id !== id));
    } catch {
      toast({ title: "Não foi possível excluir o contato.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>;
  }

  const totals = analytics?.totals || {};
  const cards = [
    { label: "Visitas ao site", value: totals.page_view || 0, icon: Eye },
    { label: "Produtos visualizados", value: totals.product_view || 0, icon: BarChart3 },
    { label: "Adicionados à seleção", value: totals.add_to_selection || 0, icon: ListPlus },
    { label: "Seleções compartilhadas", value: totals.share_selection || 0, icon: Share2 },
    { label: "Contatos pelo WhatsApp", value: totals.contact_whatsapp || 0, icon: MessageCircle }
  ];

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Últimos 30 dias</span>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-white">Resultados do catálogo</h2>
            <p className="mt-2 text-sm text-white/55">Métricas agregadas, sem identificar os visitantes.</p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 border border-gold px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gold hover:bg-gold hover:text-black">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <article key={card.label} className="border border-white/10 bg-[#171717] p-5">
              <card.icon size={19} className="text-gold" />
              <strong className="mt-5 block text-3xl text-white">{card.value}</strong>
              <span className="mt-1 block text-sm leading-snug text-white/55">{card.label}</span>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {[
            ["Produtos mais vistos", analytics?.top_products || []],
            ["Categorias mais acessadas", analytics?.top_categories || []],
            ["Páginas mais visitadas", analytics?.top_pages || []]
          ].map(([title, items]) => (
            <article key={title} className="border border-white/10 p-5">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              {items.length ? (
                <ol className="mt-4 space-y-3">
                  {items.slice(0, 5).map((item, index) => (
                    <li key={item.label} className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate text-white/60">{index + 1}. {item.label}</span>
                      <strong className="text-gold">{item.count}</strong>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-4 text-sm text-white/35">Os dados aparecerão conforme o site for utilizado.</p>}
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Atendimento comercial</span>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-white">Contatos recebidos ({leads.length})</h2>
          <p className="mt-2 text-sm text-white/55">Cadastros feitos antes do encaminhamento para o WhatsApp.</p>
        </div>

        {leads.length ? (
          <div className="space-y-4">
            {leads.map((lead) => (
              <article key={lead.id} className={`border p-5 ${lead.status === "new" ? "border-gold/55 bg-gold/[0.04]" : "border-white/10 bg-[#171717]"}`}>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
                      <span className="border border-gold/35 px-2 py-1 text-xs font-semibold text-gold">{statusLabel[lead.status] || "Novo"}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-white/70">{lead.company} · {lead.city}/{lead.state}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-white/40"><Clock3 size={12} /> {formatDate(lead.created_date)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead.phone ? <a href={whatsappHref(lead.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] px-3 py-2 text-xs font-semibold text-black"><MessageCircle size={13} /> WhatsApp</a> : null}
                    <button type="button" onClick={() => updateStatus(lead.id, "contacted")} className="inline-flex items-center gap-2 border border-gold px-3 py-2 text-xs font-semibold text-gold"><Check size={13} /> Atendido</button>
                    <button type="button" onClick={() => removeLead(lead.id)} className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/45 hover:border-red-400 hover:text-red-400"><Trash2 size={13} /> Excluir</button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap border-l-2 border-gold/45 pl-4 text-sm leading-relaxed text-white/65">{lead.message}</p>
                {(lead.email || lead.phone) ? <p className="mt-4 text-sm text-white/45">{[lead.email, lead.phone].filter(Boolean).join(" · ")}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gold/25 py-14 text-center">
            <Users className="mx-auto text-gold/45" size={32} />
            <p className="mt-4 text-sm text-white/45">Nenhum contato recebido ainda.</p>
          </div>
        )}
      </section>
    </div>
  );
}
