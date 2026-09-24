import { useInView } from "@/hooks/useInView";
import { AlertTriangle, Clock, RefreshCw, BarChart } from "lucide-react";

const problems = [
  { icon: AlertTriangle, title: "Movimentações acumuladas", desc: "Atualizações perdidas entre e-mails e planilhas." },
  { icon: Clock, title: "Prazos dispersos", desc: "Sem central unificada, o risco de perda é constante." },
  { icon: RefreshCw, title: "Atualizações manuais", desc: "Horas gastas replicando informações para clientes." },
  { icon: BarChart, title: "Falta de previsibilidade", desc: "Sem dados estruturados, não há estratégia." },
];

export default function ProblemSection() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="relative py-24 bg-[hsl(220,30%,5%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            O risco operacional invisível da advocacia
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Muitos escritórios não perdem casos por falta de conhecimento jurídico, mas por falhas operacionais que poderiam ser evitadas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p, i) => (
            <div
              key={i}
              className={`group bg-white/[0.03] border border-white/5 rounded-xl p-6 hover:border-[hsl(0,62%,50%)]/30 hover:bg-white/[0.05] transition-all duration-500 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100 + 200}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-[hsl(0,62%,50%)]/10 flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5 text-[hsl(0,62%,50%)]" />
              </div>
              <h3 className="text-white font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-white/40">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
