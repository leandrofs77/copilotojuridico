import { useInView } from "@/hooks/useInView";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "O VirtuaLexis substitui o advogado?", a: "Não. O VirtuaLexis é uma ferramenta de apoio operacional e estratégico. A validação jurídica e a tomada de decisão permanecem sob responsabilidade exclusiva do advogado." },
  { q: "Como funciona o monitoramento de processos?", a: "O sistema acompanha automaticamente as movimentações processuais e envia alertas sobre novos andamentos, prazos e eventos relevantes para cada caso cadastrado." },
  { q: "A IA gera petições automaticamente?", a: "Sim, o módulo VirtuaLexis Docs gera rascunhos de petições e documentos jurídicos com base nos dados do caso, que devem ser revisados e validados pelo advogado antes de uso." },
  { q: "Meus dados estão seguros?", a: "Sim. Utilizamos criptografia em repouso e em trânsito, isolamento multi-tenant, logs de auditoria e conformidade com a LGPD para garantir a segurança dos seus dados." },
  { q: "Existe teste gratuito?", a: "Sim. Todos os planos incluem teste gratuito de 30 dias, sem necessidade de cartão de crédito." },
];

export default function FaqSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="faq" ref={ref} className="py-24 bg-[hsl(220,30%,5%)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Perguntas frequentes
          </h2>
        </div>

        <Accordion type="single" collapsible className={`transition-all duration-700 delay-200 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-white/5">
              <AccordionTrigger className="text-white/80 hover:text-white text-left hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-white/40">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
