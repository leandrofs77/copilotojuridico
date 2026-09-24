import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Globe, Scale, Edit, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CmsPage {
  id: string;
  page_slug: string;
  page_title: string;
  page_category: string;
  html_content: string;
  published: boolean;
  updated_at: string;
  updated_by: string | null;
}

interface CmsPageListProps {
  onEditPage: (page: CmsPage) => void;
}

export function CmsPageList({ onEditPage }: CmsPageListProps) {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    const { data } = await supabase
      .from("cms_pages")
      .select("*")
      .order("page_category")
      .order("page_title");
    setPages((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const landingPages = pages.filter(p => p.page_category === "landing");
  const legalPages = pages.filter(p => p.page_category === "legal");

  const PageCard = ({ page }: { page: CmsPage }) => {
    const hasContent = page.html_content && page.html_content.trim().length > 0;

    return (
      <Card
        className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
        onClick={() => onEditPage(page)}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{page.page_title}</h3>
              {!page.published && (
                <Badge variant="secondary" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" /> Rascunho
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              /{page.page_slug}
              {hasContent ? " • Editado" : " • Conteúdo padrão"}
            </p>
            {page.updated_at && hasContent && (
              <p className="text-xs text-muted-foreground">
                Atualizado {format(new Date(page.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando páginas...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Landing Page sections */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Landing Page</h2>
          <Badge variant="outline">{landingPages.length} seções</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {landingPages.map(p => <PageCard key={p.id} page={p} />)}
        </div>
      </div>

      {/* Legal pages */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Páginas Legais</h2>
          <Badge variant="outline">{legalPages.length} páginas</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {legalPages.map(p => <PageCard key={p.id} page={p} />)}
        </div>
      </div>
    </div>
  );
}
