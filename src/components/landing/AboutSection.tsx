import { useInView } from "@/hooks/useInView";

export default function AboutSection() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="py-24 bg-[hsl(220,30%,4%)]">
      <div className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Sobre o VirtuaLexis
        </h2>
        <p className="text-white/50 leading-relaxed text-lg">
          O VirtuaLexis nasce com uma missão clara: criar infraestrutura operacional real para escritórios de advocacia.
          Não se trata de substituir o advogado, mas de amplificar sua capacidade estratégica com tecnologia de ponta,
          dados estruturados e inteligência artificial aplicada à prática jurídica do dia a dia.
        </p>
      </div>
    </section>
  );
}
