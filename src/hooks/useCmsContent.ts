import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCmsContent(slug: string) {
  return useQuery({
    queryKey: ["cms-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("html_content, page_title, published")
        .eq("page_slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (error) throw error;
      return data as { html_content: string; page_title: string; published: boolean } | null;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
