import { useInView } from "@/hooks/useInView";

const steps = [
  { num: "1", title: "Cadastro do processo", desc: "Registre os dados do caso na plataforma." },
  { num: "2", title: "Análise automática do caso", desc: "A IA analisa estratégia, riscos e força probatória." },
  { num: "3", title: "Monitoramento contínuo", desc: "Acompanhe movimentações processuais em tempo real." },
  { num: "4", title: "Centralização de prazos", desc: "Todos os prazos organizados com alertas inteligentes." },
  { num: "5", title: "Insights estratégicos", desc: "Receba recomendações geradas pela IA para cada caso." },
];

export default function HowItWorksSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="funcionamento" ref={ref} className="py-24 bg-[hsl(220,30%,5%)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Como funciona
          </h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[hsl(200,80%,55%)]/40 to-transparent" />

          <div className="space-y-10">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex gap-6 items-start transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 120 + 200}ms` }}
              >
                <div className="relative z-10 h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {s.num}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-white/40">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
