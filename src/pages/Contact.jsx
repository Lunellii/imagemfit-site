import { motion } from "framer-motion";
import { Building2, CheckCircle2, Instagram, Loader2, Mail, MapPin, MessageCircle, Store } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { commercialClient } from "@/api/commercialClient";

const WHATSAPP_NUMBER = "5547999273809";

const initialForm = {
  name: "",
  company: "",
  city: "",
  state: "",
  email: "",
  phone: "",
  message: "",
  website: ""
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.company || !form.city || form.state.length !== 2 || !form.message) {
      toast({ title: "Preencha os campos obrigatórios.", description: "Informe responsável, loja, cidade, estado e mensagem.", variant: "destructive" });
      return;
    }

    try {
      setSending(true);
      await commercialClient.leads.create(form);
      commercialClient.analytics.track("contact_whatsapp", { path: "/contato" });

      const lines = [
        "Olá, tudo bem? Gostaria de falar com o atendimento comercial da Imagem Fit.",
        "",
        `Responsável: ${form.name}`,
        `Loja / empresa: ${form.company}`,
        `Cidade: ${form.city}/${form.state.toUpperCase()}`,
        form.phone ? `Telefone: ${form.phone}` : "",
        form.email ? `E-mail: ${form.email}` : "",
        "",
        `Mensagem: ${form.message}`
      ].filter((line) => line !== "");

      toast({ title: "Contato salvo.", description: "Agora você será encaminhado ao WhatsApp comercial." });
      window.location.assign(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`);
    } catch {
      toast({ title: "Não foi possível salvar o contato.", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const fields = [
    { key: "name", label: "Responsável *", placeholder: "Seu nome completo", type: "text", autoComplete: "name" },
    { key: "company", label: "Loja / empresa *", placeholder: "Nome da sua loja", type: "text", autoComplete: "organization" },
    { key: "city", label: "Cidade *", placeholder: "Sua cidade", type: "text", autoComplete: "address-level2" },
    { key: "state", label: "Estado (UF) *", placeholder: "SC", type: "text", autoComplete: "address-level1", maxLength: 2 },
    { key: "email", label: "E-mail", placeholder: "seu@email.com", type: "email", autoComplete: "email" },
    { key: "phone", label: "Telefone / WhatsApp", placeholder: "(47) 99999-9999", type: "tel", autoComplete: "tel" }
  ];

  return (
    <div className="min-h-screen pb-16 pt-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.header className="mb-10 max-w-3xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <span className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            <Building2 size={17} /> Exclusivo para lojistas e parceiros
          </span>
          <h1 className="font-heading text-5xl font-bold leading-tight text-white md:text-6xl">Atendimento comercial</h1>
          <div className="gold-line my-6 w-20" />
          <p className="max-w-2xl text-base leading-relaxed text-white/70">
            Cadastre sua loja e descreva o que procura. O contato ficará salvo para acompanhamento e, em seguida, você falará diretamente com nossa equipe pelo WhatsApp.
          </p>
        </motion.header>

        <div className="mb-10 grid gap-4 border border-gold/45 bg-gold/[0.08] p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
          <div className="flex h-12 w-12 items-center justify-center bg-gold text-black"><Store size={22} /></div>
          <div>
            <h2 className="text-lg font-semibold text-white">Você recebeu este catálogo de uma loja?</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/65">Para comprar, monte sua seleção e compartilhe diretamente com a loja que enviou o catálogo para você.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="space-y-5 lg:col-span-3">
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/65">{field.label}</span>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(event) => updateField(field.key, field.key === "state" ? event.target.value.toUpperCase() : event.target.value)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    maxLength={field.maxLength}
                    className="w-full border border-white/15 bg-card px-4 py-3.5 text-base text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold"
                  />
                </label>
              ))}
            </div>

            <label className="block space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Como podemos ajudar? *</span>
              <textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Conte o que sua loja procura ou quais informações comerciais deseja receber..."
                rows={5}
                className="w-full resize-none border border-white/15 bg-card px-4 py-3.5 text-base text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold"
              />
            </label>

            <input type="text" value={form.website} onChange={(event) => updateField("website", event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <button type="submit" disabled={sending} className="flex w-full items-center justify-center gap-3 bg-[#25D366] py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#4ade80] disabled:opacity-60">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle size={19} />}
              {sending ? "Salvando contato..." : "Continuar pelo WhatsApp"}
            </button>
            <p className="text-center text-sm leading-relaxed text-white/45">Seu contato será salvo antes do encaminhamento para o WhatsApp.</p>
          </motion.form>

          <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="space-y-5 lg:col-span-2">
            <div className="border border-gold/30 bg-gold/[0.05] p-6">
              <MessageCircle className="text-[#25D366]" size={28} />
              <h2 className="mt-4 font-heading text-2xl font-semibold text-white">Contato comercial</h2>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="mt-2 block text-lg font-semibold text-gold hover:text-white">(47) 99927-3809</a>
              <p className="mt-3 text-sm leading-relaxed text-white/55">Segunda a sexta, das 8h às 17h. Sábado somente com horário marcado.</p>
            </div>

            {[
              { icon: MapPin, title: "Atendimento presencial", text: "Rua São Paulo, 649 · Timbó, SC · CEP 89095-220" },
              { icon: Mail, title: "E-mail", text: "atendimento.imagemfit@gmail.com" },
              { icon: Instagram, title: "Instagram", text: "@imagemfit.quadros" }
            ].map((item) => (
              <div key={item.title} className="flex gap-4 border border-white/10 p-5">
                <item.icon size={19} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{item.text}</p>
                </div>
              </div>
            ))}

            <div className="space-y-3 border-t border-white/10 pt-5">
              {["Atendimento humano", "Contato salvo para acompanhamento", "Encaminhamento direto ao WhatsApp"].map((text) => (
                <p key={text} className="flex items-center gap-3 text-sm text-white/65"><CheckCircle2 size={16} className="text-gold" /> {text}</p>
              ))}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
