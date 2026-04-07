import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://picsum.photos/seed/ifq-hero/1920/1080"
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="text-primary text-sm font-medium tracking-[0.3em] uppercase mb-4 block">Bem-vindo ao nosso estúdio</span>
          <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6">
            Arte que <span className="text-primary italic">inspira</span>
            <br />e transforma
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-4 max-w-lg">
            Há mais de uma década, transformamos visões em obras de arte. Nosso estúdio nasceu da paixão por criar imagens que contam histórias únicas e
            emocionantes.
          </p>
          <p className="text-muted-foreground/70 text-base leading-relaxed mb-10 max-w-lg">
            Cada projeto é uma nova jornada criativa. Combinamos técnica, sensibilidade e inovação para entregar resultados que superam expectativas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-sm tracking-widest uppercase font-medium rounded-none">
              <Link to="/portfolio">
                Acesse o Portfólio
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border text-foreground hover:bg-secondary px-8 py-6 text-sm tracking-widest uppercase font-medium rounded-none"
            >
              <Link to="/contato">
                <Mail className="mr-2 w-4 h-4" />
                Entre em Contato
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
