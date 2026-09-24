import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Shield, Clock, TrendingUp } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-[hsl(220,30%,4%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(200,80%,55%,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,hsl(260,70%,65%,0.08),transparent)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div className="space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(152,60%,40%)] animate-pulse" />
            Plataforma de inteligência jurídica com IA
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-white">VirtuaLexis</span>
            <br />
            <span className="bg-gradient-to-r from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] bg-clip-text text-transparent">
              O copiloto estratégico
            </span>
            <br />
            <span className="text-white">da advocacia</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed">
            Organize processos, monitore movimentações, analise estratégias e automatize tarefas jurídicas com inteligência artificial.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#planos">
              <Button size="lg" className="bg-gradient-to-r from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] text-white border-0 hover:opacity-90 text-base px-8 h-12">
                Começar gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#funcionamento">
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 text-base px-8 h-12">
                Ver demonstração
              </Button>
            </a>
          </div>
        </div>

        {/* Mockup */}
        <div className="relative animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(200,80%,55%,0.2)] to-[hsl(260,70%,65%,0.2)] rounded-2xl blur-2xl" />
          <div className="relative bg-[hsl(220,28%,10%)] border border-white/10 rounded-xl p-6 space-y-4 backdrop-blur-sm">
            {/* Title bar */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
              <div className="h-3 w-3 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-white/30">Dashboard — VirtuaLexis</span>
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BarChart3, label: "Casos Ativos", value: "47", color: "hsl(200,80%,55%)" },
                { icon: Shield, label: "Análise de Risco", value: "Baixo", color: "hsl(152,60%,40%)" },
                { icon: Clock, label: "Prazos Críticos", value: "3", color: "hsl(38,92%,50%)" },
                { icon: TrendingUp, label: "Taxa de Êxito", value: "82%", color: "hsl(260,70%,65%)" },
              ].map((card, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <card.icon className="h-4 w-4 mb-2" style={{ color: card.color }} />
                  <p className="text-[10px] text-white/40">{card.label}</p>
                  <p className="text-lg font-semibold text-white">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Chart placeholder */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/5">
              <p className="text-xs text-white/40 mb-3">Análise Estratégica do Caso</p>
              <div className="flex items-end gap-1 h-20">
                {[40, 65, 50, 80, 70, 90, 75, 85, 60, 95, 80, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] opacity-60"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              {["Petição inicial protocolada", "Audiência de conciliação agendada", "Análise de provas concluída"].map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className="h-2 w-2 rounded-full bg-[hsl(200,80%,55%)]" />
                  <span className="text-white/50">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
