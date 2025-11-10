import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  ArrowLeft, 
  Plus, 
  Heart, 
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  MoreVertical
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SocialNetwork = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    post_type: "educational",
    tags: ""
  });
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadPosts();
    };
    checkUser();
  }, [navigate]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load profiles for all post authors
      const doctorIds = [...new Set(postsData?.map(p => p.doctor_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", doctorIds);

      const profilesMap: Record<string, any> = {};
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      setProfiles(profilesMap);
      setPosts(postsData || []);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las publicaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) return;

    try {
      const tags = newPost.tags.split(",").map(t => t.trim()).filter(t => t);

      const { error } = await supabase
        .from("posts")
        .insert({
          doctor_id: user.id,
          title: newPost.title,
          content: newPost.content,
          post_type: newPost.post_type,
          tags
        });

      if (error) throw error;

      toast({
        title: "Publicación creada",
        description: "Tu contenido ha sido publicado exitosamente",
      });

      setNewPost({ title: "", content: "", post_type: "educational", tags: "" });
      setDialogOpen(false);
      await loadPosts();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la publicación",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        // Like
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
      }

      await loadPosts();
    } catch (error: any) {
      console.error("Error toggling like:", error);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    }
  };

  const handleComment = async () => {
    if (!user || !selectedPost || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from("post_comments")
        .insert({
          post_id: selectedPost.id,
          user_id: user.id,
          content: newComment
        });

      if (error) throw error;

      setNewComment("");
      await loadComments(selectedPost.id);
      await loadPosts();
    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
    }
  };

  const openCommentsDialog = (post: any) => {
    setSelectedPost(post);
    loadComments(post.id);
    setCommentsDialogOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Publicación eliminada",
        description: "Tu publicación ha sido eliminada exitosamente",
      });

      setDeletePostId(null);
      await loadPosts();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la publicación",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado exitosamente",
      });

      setDeleteCommentId(null);
      if (selectedPost) {
        await loadComments(selectedPost.id);
        await loadPosts();
      }
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el comentario",
        variant: "destructive",
      });
    }
  };

  const getPostTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      educational: "Educativo",
      case_study: "Caso Clínico",
      tip: "Consejo",
      announcement: "Anuncio"
    };
    return types[type] || type;
  };

  const getPostTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      educational: "bg-primary",
      case_study: "bg-secondary",
      tip: "bg-accent",
      announcement: "bg-info"
    };
    return colors[type] || "bg-muted";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Cargando red social...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Red Social Médica</h1>
                <p className="text-sm text-muted-foreground">Comparte conocimiento con la comunidad</p>
              </div>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Publicación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Publicación</DialogTitle>
                <DialogDescription>
                  Comparte contenido educativo, casos clínicos o consejos con otros profesionales
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="post-type">Tipo de Publicación</Label>
                  <Select value={newPost.post_type} onValueChange={(value) => setNewPost({ ...newPost, post_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational">Educativo</SelectItem>
                      <SelectItem value="case_study">Caso Clínico</SelectItem>
                      <SelectItem value="tip">Consejo</SelectItem>
                      <SelectItem value="announcement">Anuncio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="¿De qué trata tu publicación?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido *</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Comparte tu conocimiento..."
                    rows={8}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                  <Input
                    id="tags"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    placeholder="cardiología, prevención, nutrición"
                  />
                </div>

                <Button 
                  onClick={handleCreatePost} 
                  disabled={!newPost.title || !newPost.content}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Publicar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No hay publicaciones aún</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear la Primera Publicación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const author = profiles[post.doctor_id];
              return (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={author?.avatar_url} alt={author?.full_name} />
                          <AvatarFallback>
                            {author?.full_name?.split(" ").map((n: string) => n[0]).join("") || "DR"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{author?.full_name || "Doctor"}</h3>
                          <p className="text-sm text-muted-foreground">{author?.specialty || "Médico"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPostTypeColor(post.post_type)}>
                          {getPostTypeLabel(post.post_type)}
                        </Badge>
                        {user?.id === post.doctor_id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => setDeletePostId(post.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar publicación
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-4">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap">{post.content}</p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        {post.likes_count}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openCommentsDialog(post)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {post.comments_count}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Comments Dialog */}
        <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comentarios</DialogTitle>
              <DialogDescription>{selectedPost?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {comments.map((comment) => {
                const commenter = profiles[comment.user_id];
                return (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={commenter?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {commenter?.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{commenter?.full_name || "Usuario"}</p>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                          {user?.id === comment.user_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setDeleteCommentId(comment.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-3">
                        {new Date(comment.created_at).toLocaleString("es-ES")}
                      </p>
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No hay comentarios aún. ¡Sé el primero en comentar!
                </p>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  onKeyPress={(e) => e.key === "Enter" && handleComment()}
                />
                <Button onClick={handleComment} disabled={!newComment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Post Confirmation */}
        <AlertDialog open={deletePostId !== null} onOpenChange={() => setDeletePostId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La publicación será eliminada permanentemente junto con todos sus comentarios y likes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePostId && handleDeletePost(deletePostId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Comment Confirmation */}
        <AlertDialog open={deleteCommentId !== null} onOpenChange={() => setDeleteCommentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default SocialNetwork;
