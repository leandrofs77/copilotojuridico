import { useInView } from "@/hooks/useInView";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    period: "para começar",
    features: ["Até 10 processos", "1 usuário", "Análise básica com IA", "Monitoramento manual"],
    highlight: false,
    stripePriceId: null,
  },
  {
    name: "Professional",
    price: "R$ 197",
    period: "/mês",
    features: ["Até 100 processos", "5 usuários", "IA avançada ilimitada", "Monitoramento automático", "Geração de documentos", "Suporte prioritário"],
    highlight: true,
    stripePriceId: STRIPE_PLANS.professional.price_id,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    features: ["Processos ilimitados", "Usuários ilimitados", "IA personalizada", "API dedicada", "Onboarding exclusivo", "SLA garantido"],
    highlight: false,
    stripePriceId: null,
  },
];

export default function PricingSection() {
  const { ref, isInView } = useInView();
  const { user } = useAuth();
  const { subscription, startCheckout } = useSubscription();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handlePlanClick = async (plan: typeof plans[0]) => {
    if (!plan.stripePriceId) {
      // Free plan — just navigate to login/signup
      if (!user) {
        navigate("/login");
      } else {
        navigate("/dashboard");
      }
      return;
    }

    if (!user) {
      toast.info("Faça login para assinar um plano");
      navigate("/login");
      return;
    }

    // Check if already subscribed to this product
    if (subscription?.subscribed && subscription.product_id === STRIPE_PLANS.professional.product_id) {
      toast.info("Você já possui este plano ativo!");
      return;
    }

    setCheckoutLoading(plan.name);
    try {
      await startCheckout(plan.stripePriceId);
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento: " + (err.message || "Tente novamente"));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const isCurrentPlan = (plan: typeof plans[0]) => {
    if (!subscription?.subscribed) return false;
    if (plan.stripePriceId && subscription.product_id === STRIPE_PLANS.professional.product_id) return true;
    return false;
  };

  return (
    <section id="planos" ref={ref} className="py-24 bg-[hsl(220,30%,5%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Planos
          </h2>
          <p className="text-white/50">Comece gratuitamente. Escale conforme sua necessidade.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isCurrent = isCurrentPlan(plan);
            return (
              <div
                key={i}
                className={`relative rounded-xl p-8 transition-all duration-500 ${
                  plan.highlight
                    ? "bg-gradient-to-b from-[hsl(200,80%,55%)]/10 to-[hsl(260,70%,65%)]/10 border border-[hsl(200,80%,55%)]/30 scale-[1.02]"
                    : "bg-white/[0.02] border border-white/5"
                } ${isCurrent ? "ring-2 ring-[hsl(152,60%,40%)]" : ""} ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 120 + 200}ms` }}
              >
                {plan.highlight && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    Mais popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(152,60%,40%)] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    Seu plano
                  </div>
                )}
                <h3 className="text-white font-semibold text-lg mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-white/40">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/50">
                      <Check className="h-4 w-4 text-[hsl(152,60%,40%)] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.name === "Enterprise" ? (
                  <a
                    href="https://wa.me/5531975170987?text=Ol%C3%A1%20Leandro%2C%20vi%20o%20site%20do%20VirtuaLexis%20e%20me%20interessei.%20Gostaria%20de%20maiores%20informa%C3%A7%C3%B5es."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full bg-white/5 text-white border border-white/10 hover:bg-white/10">
                      Falar com vendas
                    </Button>
                  </a>
                ) : (
                  <Button
                    className={`w-full ${
                      isCurrent
                        ? "bg-[hsl(152,60%,40%)] text-white hover:bg-[hsl(152,60%,35%)]"
                        : plan.highlight
                          ? "bg-gradient-to-r from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] text-white border-0 hover:opacity-90"
                          : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => handlePlanClick(plan)}
                    disabled={checkoutLoading === plan.name || isCurrent}
                  >
                    {checkoutLoading === plan.name ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                    ) : isCurrent ? (
                      "Plano atual"
                    ) : plan.stripePriceId ? (
                      "Assinar agora"
                    ) : (
                      "Começar teste gratuito"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className={`text-center text-sm text-white/30 mt-8 transition-all duration-700 delay-500 ${isInView ? "opacity-100" : "opacity-0"}`}>
          Todos os planos incluem teste gratuito de 14 dias. Sem compromisso.
        </p>
      </div>
    </section>
  );
}
