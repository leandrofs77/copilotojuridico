import { useInView } from "@/hooks/useInView";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(200,80%,55%,0.15)] via-[hsl(220,30%,4%)] to-[hsl(260,70%,65%,0.15)]" />
      <div className={`relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Estruture sua advocacia com inteligência.
        </h2>
        <p className="text-white/50 mb-10 text-lg">
          Comece gratuitamente e descubra como o VirtuaLexis transforma sua prática jurídica.
        </p>
        <a href="#planos">
          <Button size="lg" className="bg-gradient-to-r from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] text-white border-0 hover:opacity-90 text-base px-10 h-13">
            Começar gratuitamente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>
    </section>
  );
}
