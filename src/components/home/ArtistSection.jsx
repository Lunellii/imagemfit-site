import { motion } from "framer-motion";

export default function ArtistSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}artist/almir-donizete-goncalves.png`} alt="Almir Donizete Gonçalves" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-primary/30" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="text-primary text-sm font-medium tracking-[0.3em] uppercase mb-4 block">O Artista</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Criatividade sem <span className="text-primary italic">limites</span>
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Com mais de 30 anos de experiência na arte visual, nosso artista principal combina técnicas tradicionais com tecnologias modernas para criar
                imagens impactantes e memoráveis.
              </p>
              <p>
                Cada obra é criada com atenção meticulosa aos detalhes, buscando sempre capturar a essência e a emoção de cada momento. Sua abordagem única
                combina sensibilidade artística com precisão técnica.
              </p>
              <p>
                Já participou de diversas exposições e colaborou com marcas renomadas, sempre mantendo sua visão autoral e compromisso com a excelência.
              </p>
            </div>
            <div className="mt-10 flex gap-12">
              <div>
                <span className="font-heading text-4xl font-bold text-primary">30+</span>
                <p className="text-sm text-muted-foreground mt-1">Anos de experiência</p>
              </div>
              <div>
                <span className="font-heading text-4xl font-bold text-primary">+2000</span>
                <p className="text-sm text-muted-foreground mt-1">Projetos realizados</p>
              </div>
              <div>
                <span className="font-heading text-4xl font-bold text-primary">50+</span>
                <p className="text-sm text-muted-foreground mt-1">Clientes satisfeitos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
