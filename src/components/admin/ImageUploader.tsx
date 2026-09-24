import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Link, Image, Trash2, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onSelect: (url: string) => void;
}

export function ImageUploader({ onSelect }: ImageUploaderProps) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<{ id: string; url: string; storage_path: string | null; alt_text: string | null; created_at: string }[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const fetchGallery = async () => {
    setLoadingGallery(true);
    const { data } = await supabase
      .from("cms_images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setGallery((data as any[]) || []);
    setLoadingGallery(false);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("cms-images")
      .upload(path, file);

    if (uploadError) {
      toast.error("Erro no upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("cms-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { data: session } = await supabase.auth.getSession();
    await supabase.from("cms_images").insert({
      url: publicUrl,
      storage_path: path,
      uploaded_by: session?.session?.user?.id || null,
    } as any);

    toast.success("Imagem enviada!");
    setUploading(false);
    fetchGallery();
    onSelect(publicUrl);
  };

  const handleUrlInsert = () => {
    if (!url.trim()) return;
    onSelect(url.trim());
    setUrl("");
  };

  const handleDelete = async (img: typeof gallery[0]) => {
    if (img.storage_path) {
      await supabase.storage.from("cms-images").remove([img.storage_path]);
    }
    await supabase.from("cms_images").delete().eq("id", img.id);
    toast.success("Imagem removida");
    fetchGallery();
  };

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="upload" className="flex-1"><Upload className="h-4 w-4 mr-1" /> Upload</TabsTrigger>
        <TabsTrigger value="url" className="flex-1"><Link className="h-4 w-4 mr-1" /> URL</TabsTrigger>
        <TabsTrigger value="gallery" className="flex-1"><Image className="h-4 w-4 mr-1" /> Galeria</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="space-y-4 pt-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id="cms-image-upload"
            disabled={uploading}
          />
          <label htmlFor="cms-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading ? "Enviando..." : "Clique para enviar uma imagem"}
            </span>
          </label>
        </div>
      </TabsContent>

      <TabsContent value="url" className="space-y-4 pt-4">
        <div>
          <Label>URL da imagem</Label>
          <div className="flex gap-2 mt-1">
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
            <Button onClick={handleUrlInsert} disabled={!url.trim()}>Inserir</Button>
          </div>
        </div>
        {url && (
          <div className="border rounded-lg p-2">
            <img src={url} alt="Preview" className="max-h-40 mx-auto object-contain" onError={() => toast.error("URL inválida")} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="gallery" className="pt-4">
        {loadingGallery ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : gallery.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma imagem na galeria</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-auto">
            {gallery.map(img => (
              <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                <img
                  src={img.url}
                  alt={img.alt_text || ""}
                  className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSelect(img.url)}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
