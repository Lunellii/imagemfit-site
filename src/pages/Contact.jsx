import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Loader2, Instagram } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    try {
      setSending(true);
      const subject = `Contato de ${form.name} - Imagem Fit`;
      const body = `Nome: ${form.name}\nEmail: ${form.email}\nTelefone: ${form.phone}\n\nMensagem:\n${form.message}`;
      const mailto = `mailto:atendimento.imagemfit@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, "_self");
      toast({ title: "Mensagem preparada no seu email.", description: "Finalize o envio no app de email." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (_err) {
      toast({ title: "Erro ao abrir o email.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const info = [
    { icon: Phone, label: "WhatsApp", value: "(47) 99927-3809", href: "https://wa.me/5547999273809" },
    { icon: Instagram, label: "Instagram", value: "@imagemfit.quadros", href: "https://instagram.com/imagemfit.quadros" },
    { icon: Mail, label: "Email", value: "atendimento.imagemfit@gmail.com", href: "mailto:atendimento.imagemfit@gmail.com" },
    { icon: MapPin, label: "Endereço", value: "Rua São Paulo, 649 - Timbó, SC - CEP 89095-220", href: null }
  ];

  const representatives = [
    {
      name: "Jonas",
      region: "Paraná (região de Curitiba)",
      phoneLabel: "+55 41 9234-9935",
      phoneHref: "https://wa.me/554192349935"
    },
    {
      name: "Almir",
      region: "Santa Catarina e Rio Grande do Sul",
      phoneLabel: "+55 47 9936-7928",
      phoneHref: "https://wa.me/554799367928"
    }
  ];

  return (
    <div className="pt-28 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div className="mb-14" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-4">Fale Conosco</span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">Contato</h1>
          <div className="gold-line w-20 mb-6" />
          <p className="text-white/60 max-w-xl text-sm leading-relaxed">
            Tem interesse em um quadro especial ou quer saber mais sobre nossos trabalhos? Entre em contato.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 space-y-5">
            {[
              { key: "name", label: "Nome *", placeholder: "Seu nome completo", type: "text" },
              { key: "email", label: "Email *", placeholder: "seu@email.com", type: "email" },
              { key: "phone", label: "Telefone / WhatsApp", placeholder: "(11) 99999-9999", type: "tel" }
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-white/50 text-xs tracking-[0.2em] uppercase">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3.5 text-sm outline-none focus:border-gold transition-colors"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs tracking-[0.2em] uppercase">Mensagem *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Descreva o que você procura..."
                rows={5}
                className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3.5 text-sm outline-none focus:border-gold transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gold text-black py-4 text-xs tracking-[0.3em] uppercase font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={14} />}
              {sending ? "Abrindo email..." : "Enviar Mensagem"}
            </button>
          </motion.form>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 flex flex-col justify-start space-y-6 pt-2">
            {info.map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-5 border border-border hover:border-gold/40 transition-colors">
                <div className="w-9 h-9 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <item.icon size={14} className="text-gold" />
                </div>
                <div>
                  <p className="text-white/40 text-xs tracking-widest uppercase mb-1">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-white text-sm hover:text-gold transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-white text-sm">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="p-5 border border-border">
              <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Horário</p>
              <div className="space-y-1 text-sm text-white/60">
                <p>Seg - Sex: 08:00 - 17:00</p>
                <p>Sáb: somente com horário marcado</p>
                <p className="text-white/30">Dom: Fechado</p>
              </div>
            </div>

            <div className="p-5 border border-border">
              <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Representantes</p>
              <div className="space-y-4">
                {representatives.map((rep) => (
                  <div key={rep.name} className="border border-border/80 p-4">
                    <p className="text-white text-sm font-semibold">{rep.name}</p>
                    <p className="text-white/55 text-xs mt-1">{rep.region}</p>
                    <a href={rep.phoneHref} target="_blank" rel="noreferrer" className="inline-block mt-2 text-gold text-sm hover:text-gold/80 transition-colors">
                      {rep.phoneLabel}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
