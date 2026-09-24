import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import virtualexisLogoFull from "@/assets/virtualexis-logo-full.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[hsl(220,30%,4%)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <img src={virtualexisLogoFull} alt="VirtuaLexis" className="h-8 object-contain mb-3" />
            <p className="text-xs text-white/30 leading-relaxed">
              O copiloto estratégico da advocacia.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/60 mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-white/30">
              <li><Link to="/privacy-policy" className="hover:text-white/60 transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white/60 transition-colors">Termos de Serviço</Link></li>
              <li><Link to="/saas-license" className="hover:text-white/60 transition-colors">Licença SaaS</Link></li>
              <li><Link to="/ai-disclaimer" className="hover:text-white/60 transition-colors">Aviso de IA</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/60 mb-3">Produto</p>
            <ul className="space-y-2 text-sm text-white/30">
              <li><a href="#solucao" className="hover:text-white/60 transition-colors">Módulos</a></li>
              <li><a href="#tecnologia" className="hover:text-white/60 transition-colors">Tecnologia</a></li>
              <li><a href="#planos" className="hover:text-white/60 transition-colors">Planos</a></li>
              <li><a href="#faq" className="hover:text-white/60 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/60 mb-3">Contato</p>
            <p className="text-sm text-white/30 mb-2">leandrofs77@gmail.com</p>
            <a
              href="https://wa.me/5531975170987?text=Ol%C3%A1%20Leandro%2C%20vi%20o%20site%20do%20VirtuaLexis%20e%20me%20interessei.%20Gostaria%20de%20maiores%20informa%C3%A7%C3%B5es."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[hsl(152,60%,40%)] hover:text-[hsl(152,60%,50%)] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8">
          <p className="text-[11px] text-white/20 text-center leading-relaxed">
            O VirtuaLexis é uma ferramenta de apoio operacional. A validação jurídica permanece sob responsabilidade do advogado.
          </p>
          <p className="text-[11px] text-white/20 text-center mt-2">
            © {new Date().getFullYear()} VirtuaLexis. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
