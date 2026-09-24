import { useInView } from "@/hooks/useInView";
import { Radar, Bot, FileText, Activity, CalendarClock, BookOpen, FlaskConical, Map } from "lucide-react";

const modules = [
  { icon: Radar, name: "VirtuaLexis Radar", desc: "Análise estratégica automática de casos." },
  { icon: Bot, name: "VirtuaLexis Assistant", desc: "Sugestões de ações jurídicas com base em dados." },
  { icon: FileText, name: "VirtuaLexis Docs", desc: "Geração inteligente de petições e documentos." },
  { icon: Activity, name: "VirtuaLexis Monitor", desc: "Monitoramento processual automático." },
  { icon: CalendarClock, name: "VirtuaLexis Deadlines", desc: "Central inteligente de prazos com análise de risco." },
  { icon: BookOpen, name: "Memória Jurídica", desc: "Base institucional de argumentos e precedentes." },
  { icon: FlaskConical, name: "Simulador de Força Probatória", desc: "Avaliação da robustez das provas de um caso." },
  { icon: Map, name: "Mapa Visual do Caso", desc: "Diagnóstico completo da situação processual." },
];

export default function SolutionSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="solucao" ref={ref} className="relative py-24 bg-[hsl(220,30%,4%)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,hsl(200,80%,55%,0.06),transparent)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Infraestrutura de Inteligência Jurídica
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            O VirtuaLexis cria infraestrutura operacional para escritórios que buscam estratégia, previsibilidade e controle.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((m, i) => (
            <div
              key={i}
              className={`group relative bg-white/[0.03] border border-white/5 rounded-xl p-6 hover:border-[hsl(200,80%,55%)]/30 hover:bg-white/[0.06] transition-all duration-500 hover:scale-[1.02] ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 80 + 200}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[hsl(200,80%,55%)]/10 to-[hsl(260,70%,65%)]/10 flex items-center justify-center mb-4 group-hover:from-[hsl(200,80%,55%)]/20 group-hover:to-[hsl(260,70%,65%)]/20 transition-all">
                <m.icon className="h-5 w-5 text-[hsl(200,80%,55%)]" />
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">{m.name}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
