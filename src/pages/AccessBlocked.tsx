import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, PauseCircle, ShieldOff, XCircle, LogOut, AlertTriangle, MessageCircle } from "lucide-react";

interface AccessBlockedPageProps {
  status: "pending" | "paused" | "suspended" | "cancelled" | "license_expired";
  reason?: string | null;
}

const statusConfig = {
  pending: {
    icon: Clock,
    title: "Conta aguardando aprovação",
    description: "Sua conta foi criada com sucesso. Estamos analisando seu cadastro e em breve você terá acesso à plataforma.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  paused: {
    icon: PauseCircle,
    title: "Conta temporariamente pausada",
    description: "Sua conta está temporariamente pausada. Se você acredita que isso é um engano, entre em contato com o suporte.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  suspended: {
    icon: ShieldOff,
    title: "Conta suspensa",
    description: "Sua conta foi suspensa. Entre em contato com a administração para regularizar sua situação.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  cancelled: {
    icon: XCircle,
    title: "Conta cancelada",
    description: "Sua conta foi cancelada. Se deseja reativar seu acesso, entre em contato com a administração.",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  license_expired: {
    icon: AlertTriangle,
    title: "Licença expirada",
    description: "Sua licença de acesso expirou. Entre em contato para renovar seu plano e continuar usando a plataforma.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
};

// WhatsApp number for support (replace with actual number)
const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MESSAGE = "Olá! Preciso de ajuda com minha conta no VirtualExis.";

export default function AccessBlockedPage({ status, reason }: AccessBlockedPageProps) {
  const { signOut } = useAuth();
  const config = statusConfig[status];
  const Icon = config.icon;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className={`mx-auto w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`h-10 w-10 ${config.color}`} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">{config.title}</h1>
          <p className="text-muted-foreground">{config.description}</p>
          
          {/* Show reason if provided */}
          {reason && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Motivo:</strong> {reason}
              </p>
            </div>
          )}
        </div>
        <div className="pt-4 space-y-3">
          {/* WhatsApp contact button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-[#25D366] text-white font-medium hover:bg-[#128C7E] transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Falar pelo WhatsApp
          </a>
          
          <a
            href="mailto:suporte@virtualexis.com"
            className="block text-sm text-primary hover:underline"
          >
            Ou envie um email para suporte@virtualexis.com
          </a>
          
          <Button variant="outline" onClick={signOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
