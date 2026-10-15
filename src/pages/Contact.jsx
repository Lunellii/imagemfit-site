import { Instagram, Loader2, Mail, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { commercialClient } from "@/api/commercialClient";

const WHATSAPP_NUMBER = "5547999273809";
const INSTAGRAM_URL = "https://instagram.com/imagemfit.quadros";

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
    <div className="min-h-screen bg-paper pb-24 pt-28 font-sans text-ink md:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <header className="max-w-3xl border-b border-line pb-8">
          <h1 className="font-display text-5xl font-semibold leading-none md:text-6xl">Atendimento comercial</h1>
          <p className="mt-4 text-lg leading-relaxed text-stone">
            Conte um pouco sobre a sua loja. Salvamos o contato e você segue direto para o WhatsApp da nossa equipe.
          </p>
        </header>

        <div className="mt-6 border-l-2 border-brass bg-white p-5">
          <h2 className="font-semibold">Recebeu este catálogo de uma loja?</h2>
          <p className="mt-1 leading-relaxed text-stone">Para comprar, monte sua seleção e envie para a loja que compartilhou o catálogo com você.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-14 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="block text-sm font-semibold">{field.label}</span>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(event) => updateField(field.key, field.key === "state" ? event.target.value.toUpperCase() : event.target.value)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    maxLength={field.maxLength}
                    className="h-12 w-full border border-line bg-white px-4 text-base outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
                  />
                </label>
              ))}
            </div>

            <label className="block space-y-2">
              <span className="block text-sm font-semibold">Como podemos ajudar? *</span>
              <textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="O que sua loja procura ou quais informações você quer receber"
                rows={5}
                className="w-full resize-none border border-line bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
              />
            </label>

            <input type="text" value={form.website} onChange={(event) => updateField("website", event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <button type="submit" disabled={sending} className="flex h-14 w-full items-center justify-center gap-3 bg-ink text-base font-semibold text-paper transition-colors hover:bg-brass disabled:opacity-60">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle size={20} />}
              {sending ? "Salvando contato..." : "Continuar pelo WhatsApp"}
            </button>
            <p className="text-sm text-stone">* Campos obrigatórios.</p>
          </form>

          <aside className="space-y-8">
            <div>
              <h2 className="text-sm text-stone">WhatsApp comercial</h2>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="font-display mt-1 block text-3xl font-semibold transition-colors hover:text-brass">(47) 99927-3809</a>
              <p className="mt-2 text-stone">Segunda a sexta, das 8h às 17h. Sábado com horário marcado.</p>
            </div>

            <dl className="divide-y divide-line border-y border-line">
              <div className="py-4">
                <dt className="text-sm text-stone">Endereço</dt>
                <dd className="mt-1">
                  Rua São Paulo, 649 · Timbó, SC · 89095-220
                  <a href="https://www.google.com/maps/search/?api=1&query=Rua+S%C3%A3o+Paulo+649+Timb%C3%B3+SC" target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brass">
                    <MapPin size={15} /> Ver no mapa
                  </a>
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-stone">E-mail</dt>
                <dd className="mt-1">
                  <a href="mailto:atendimento.imagemfit@gmail.com" className="flex items-center gap-2 break-all transition-colors hover:text-brass">
                    <Mail size={16} className="shrink-0" /> atendimento.imagemfit@gmail.com
                  </a>
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-stone">Instagram</dt>
                <dd className="mt-1">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => commercialClient.analytics.track("contact_instagram", { path: "/contato" })}
                    className="flex items-center gap-2 transition-colors hover:text-brass"
                  >
                    <Instagram size={16} /> @imagemfit.quadros
                  </a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
