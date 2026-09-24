import { useInView } from "@/hooks/useInView";
import { Shield, Lock, FileCheck, Users, Download } from "lucide-react";

const items = [
  { icon: Lock, title: "Criptografia de dados", desc: "Todos os dados são criptografados em repouso e em trânsito." },
  { icon: Users, title: "Isolamento multi-tenant", desc: "Cada escritório possui ambiente isolado e seguro." },
  { icon: FileCheck, title: "Logs de auditoria", desc: "Registro completo de todas as ações na plataforma." },
  { icon: Shield, title: "Controle de acesso", desc: "Permissões granulares por usuário e função." },
  { icon: Download, title: "Exportação de dados", desc: "Seus dados sempre disponíveis para exportação." },
];

export default function SecuritySection() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="py-24 bg-[hsl(220,30%,4%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Segurança e conformidade com a LGPD
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {items.map((item, i) => (
            <div
              key={i}
              className={`bg-white/[0.03] border border-white/5 rounded-xl p-5 text-center hover:border-[hsl(200,80%,55%)]/20 transition-all duration-500 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 80 + 200}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-[hsl(200,80%,55%)]/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-5 w-5 text-[hsl(200,80%,55%)]" />
              </div>
              <h3 className="text-white text-sm font-semibold mb-1">{item.title}</h3>
              <p className="text-[11px] text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
