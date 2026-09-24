import { useInView } from "@/hooks/useInView";
import { X, Check } from "lucide-react";

const before = [
  "Planilhas dispersas",
  "Controle manual de prazos",
  "Monitoramento manual",
  "Comunicação improvisada com clientes",
];

const after = [
  "Central jurídica unificada",
  "Alertas inteligentes de prazos",
  "Análise estratégica automatizada",
  "Fluxo operacional organizado",
];

export default function BeforeAfterSection() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="py-24 bg-[hsl(220,30%,5%)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Antes vs Depois
          </h2>
        </div>

        <div className={`grid md:grid-cols-2 gap-8 transition-all duration-700 delay-200 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8">
            <p className="text-sm font-semibold text-[hsl(0,62%,50%)] mb-6 uppercase tracking-wider">Sem VirtuaLexis</p>
            <ul className="space-y-4">
              {before.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/40">
                  <X className="h-4 w-4 text-[hsl(0,62%,50%)] shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/[0.03] border border-[hsl(152,60%,40%)]/20 rounded-xl p-8">
            <p className="text-sm font-semibold text-[hsl(152,60%,40%)] mb-6 uppercase tracking-wider">Com VirtuaLexis</p>
            <ul className="space-y-4">
              {after.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/70">
                  <Check className="h-4 w-4 text-[hsl(152,60%,40%)] shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
