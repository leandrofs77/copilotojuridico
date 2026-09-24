import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCmsContent } from "@/hooks/useCmsContent";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import virtualexisLogo from "@/assets/virtualexis-logo.png";

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos. Verifique seus dados ou use 'Esqueceu a senha?'",
    "Email not confirmed": "Seu email ainda não foi confirmado. Verifique sua caixa de entrada.",
    "User already registered": "Este email já está cadastrado. Tente fazer login.",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
    "Signup requires a valid password": "Digite uma senha válida.",
    "Unable to validate email address: invalid format": "Formato de email inválido.",
    "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "For security purposes, you can only request this once every 60 seconds": "Por segurança, aguarde 60 segundos antes de tentar novamente.",
  };
  for (const [key, value] of Object.entries(map)) {
    if (message.includes(key)) return value;
  }
  return message;
}

function isOAuthCallback(): boolean {
  return window.location.pathname.includes("/~oauth") ||
    window.location.hash.includes("id_token") ||
    window.location.search.includes("code=");
}

export default function Login() {
  const navigate = useNavigate();
  const { data: cms } = useCmsContent("login");
  const [loading, setLoading] = useState(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") || "";
  });
  const [magicEmail, setMagicEmail] = useState("");

  // Process OAuth callback when returning from Google
  useEffect(() => {
    if (!isOAuthCallback()) return;
    
    console.log("[Login] OAuth callback detected, processing...");
    setOauthProcessing(true);
    
    const processOAuth = async () => {
      try {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin + "/login",
        });
        
        if (result.error) {
          console.error("[Login] OAuth processing error:", result.error);
          setAuthError("Não foi possível finalizar o login com Google. Tente novamente ou use email/senha.");
          setOauthProcessing(false);
          // Clean URL
          window.history.replaceState({}, "", "/login");
          return;
        }
        
        console.log("[Login] OAuth processed, checking session...");
        // Wait briefly for session to propagate
        await new Promise(r => setTimeout(r, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("[Login] Session found, navigating to dashboard");
          window.history.replaceState({}, "", "/login");
          navigate("/dashboard");
        } else {
          console.warn("[Login] No session after OAuth processing");
          setAuthError("Login com Google processado mas sessão não encontrada. Tente novamente.");
          setOauthProcessing(false);
          window.history.replaceState({}, "", "/login");
        }
      } catch (err) {
        console.error("[Login] OAuth callback failed:", err);
        setAuthError("Erro ao processar login com Google. Tente novamente.");
        setOauthProcessing(false);
        window.history.replaceState({}, "", "/login");
      }
    };
    
    processOAuth();
    
    // Safety timeout
    const timer = setTimeout(() => {
      setOauthProcessing(false);
      setAuthError("Tempo esgotado ao finalizar login com Google. Tente novamente.");
      window.history.replaceState({}, "", "/login");
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = translateAuthError(error.message);
      setAuthError(msg);
      toast.error(msg);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: signupName, ...(referralCode ? { referral_code: referralCode } : {}) },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      const msg = translateAuthError(error.message);
      setAuthError(msg);
      toast.error(msg);
    } else {
      toast.success("Conta criada! Você já pode fazer login.");
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      const msg = translateAuthError(error.message);
      setAuthError(msg);
      toast.error(msg);
    } else {
      toast.success("Link mágico enviado! Verifique seu email.");
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (error) {
      setAuthError("Não foi possível conectar com Google. Tente novamente ou use email/senha.");
      toast.error("Erro ao conectar com Google");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("Digite seu email no campo acima para recuperar a senha.");
      toast.error("Digite seu email primeiro");
      return;
    }
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      const msg = translateAuthError(error.message);
      setAuthError(msg);
      toast.error(msg);
    } else {
      toast.success("Email de recuperação enviado!");
    }
  };

  // Show processing state when returning from OAuth
  if (oauthProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={virtualexisLogo} alt="VirtuaLexis" className="h-10 w-10 object-contain" />
            <h1 className="text-3xl font-display font-bold text-foreground">VirtuaLexis</h1>
          </div>
          <Card className="p-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Finalizando login com Google...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={virtualexisLogo} alt="VirtuaLexis" className="h-10 w-10 object-contain" />
          <h1 className="text-3xl font-display font-bold text-foreground">VirtuaLexis</h1>
        </div>

        <Card>
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login" onClick={() => setAuthError(null)}>Entrar</TabsTrigger>
                <TabsTrigger value="signup" onClick={() => setAuthError(null)}>Cadastro</TabsTrigger>
                <TabsTrigger value="magic" onClick={() => setAuthError(null)}>Magic Link</TabsTrigger>
              </TabsList>
              {cms?.html_content && cms.html_content.trim() ? (
                <div className="text-center mt-2 text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cms.html_content }} />
              ) : (
                <CardDescription className="text-center mt-2">
                  Gerencie seus casos jurídicos com inteligência
                </CardDescription>
              )}
            </CardHeader>

            <CardContent>
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="seu@email.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                  </Button>
                  <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline w-full text-center">
                    Esqueceu a senha?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Seu nome" className="pl-9" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="seu@email.com" className="pl-9" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Mín. 6 caracteres" className="pl-9" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Código de indicação <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                    <Input placeholder="Ex: VLX-XXXX-YYYY" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magic">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="seu@email.com" className="pl-9" value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)} required />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enviaremos um link de acesso direto para seu email.
                  </p>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link mágico"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou continue com</span></div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Ao acessar ou criar uma conta, você concorda com os{" "}
                <Link to="/terms-of-service" className="text-primary hover:underline">Termos de Serviço</Link>,{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidade</Link>,{" "}
                <Link to="/saas-license" className="text-primary hover:underline">Licença SaaS</Link> e o{" "}
                <Link to="/ai-disclaimer" className="text-primary hover:underline">Aviso Legal de IA</Link>.
              </p>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
