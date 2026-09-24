import { useInView } from "@/hooks/useInView";
import { Brain, FileSearch, TrendingUp, FlaskConical, BookOpen } from "lucide-react";

const features = [
  { icon: Brain, label: "Análise estratégica de casos" },
  { icon: FileSearch, label: "Geração de documentos jurídicos" },
  { icon: TrendingUp, label: "Identificação de padrões em processos" },
  { icon: FlaskConical, label: "Simulação de força probatória" },
  { icon: BookOpen, label: "Memória institucional de argumentos" },
];

export default function TechnologySection() {
  const { ref, isInView } = useInView();

  return (
    <section id="tecnologia" ref={ref} className="py-24 bg-[hsl(220,30%,4%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
        <div className={`space-y-8 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Inteligência artificial aplicada à prática jurídica
          </h2>
          <p className="text-white/50 leading-relaxed">
            O VirtuaLexis utiliza IA para transformar dados processuais em insights estratégicos, automatizar tarefas repetitivas e fortalecer a tomada de decisão do advogado.
          </p>
          <ul className="space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[hsl(200,80%,55%)]/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-[hsl(200,80%,55%)]" />
                </div>
                <span className="text-sm text-white/60">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Module diagram */}
        <div className={`transition-all duration-700 delay-300 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(200,80%,55%,0.1)] to-[hsl(260,70%,65%,0.1)] rounded-2xl blur-xl" />
            <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <div className="grid grid-cols-3 gap-4">
                {["Radar", "Assistant", "Docs", "Monitor", "Deadlines", "Memória", "Simulador", "Mapa", "IA Core"].map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center h-16 rounded-lg border text-xs font-medium transition-all ${
                      i === 8
                        ? "bg-gradient-to-br from-[hsl(200,80%,55%)]/20 to-[hsl(260,70%,65%)]/20 border-[hsl(200,80%,55%)]/30 text-white col-span-3"
                        : "bg-white/[0.03] border-white/5 text-white/50"
                    }`}
                  >
                    {m}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/30 text-center mt-4">Módulos integrados com inteligência artificial central</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
