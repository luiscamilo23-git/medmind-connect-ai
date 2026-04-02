import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorLayout } from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Search, Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: string;
  published: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function ModeratorSocial() {
  const { logAction } = useModerator();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
    logAction("VIEW", "social_posts");
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, post_type, published, likes_count, comments_count, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (post: Post) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ published: !post.published })
        .eq('id', post.id);

      if (error) throw error;
      
      logAction("UPDATE", "posts", post.id, "posts", { action: post.published ? "unpublish" : "publish" });
      toast.success(post.published ? "Post ocultado" : "Post publicado");
      loadPosts();
    } catch (error) {
      toast.error("Error al actualizar el post");
    }
  };

  const deletePost = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      logAction("DELETE", "posts", deleteId, "posts");
      toast.success("Post eliminado");
      setDeleteId(null);
      loadPosts();
    } catch (error) {
      toast.error("Error al eliminar el post");
    }
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ModeratorLayout title="Red Social" icon={<Globe className="w-6 h-6 text-orange-500" />}>
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Moderación de Publicaciones</span>
            <Badge variant="outline" className="text-orange-400 border-orange-500">
              {filteredPosts.length} posts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o contenido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="rounded-md border border-orange-500/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.post_type}</Badge>
                      </TableCell>
                      <TableCell>{post.likes_count}</TableCell>
                      <TableCell>{post.comments_count}</TableCell>
                      <TableCell>
                        <Badge className={post.published ? "bg-primary/20 text-primary" : "bg-gray-500/20 text-gray-400"}>
                          {post.published ? "Publicado" : "Oculto"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(post.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublish(post)}
                            title={post.published ? "Ocultar" : "Publicar"}
                          >
                            {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(post.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPosts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No se encontraron publicaciones
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La publicación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deletePost} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModeratorLayout>
  );
}
