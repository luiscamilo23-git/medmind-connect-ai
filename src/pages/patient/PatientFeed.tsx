import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  tags: string[];
  profiles: {
    full_name: string;
    avatar_url: string;
    specialty: string;
  };
  isLiked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const PatientFeed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", session.user.id);

      const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);

      // Fetch doctor profiles separately
      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, specialty")
            .eq("id", post.doctor_id)
            .single();

          return {
            ...post,
            profiles: profile || { full_name: "", avatar_url: "", specialty: "" },
            isLiked: likedPostIds.has(post.id),
          };
        })
      );

      setPosts(postsWithProfiles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
      }

      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes_count: p.isLiked ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile || { full_name: "", avatar_url: "" },
          };
        })
      );

      setComments(commentsWithProfiles);
      setSelectedPost(postId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: userId,
        content: newComment,
      });

      if (error) throw error;

      setNewComment("");
      loadComments(postId);

      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );

      toast({
        title: "Comentario publicado",
        description: "Tu comentario ha sido añadido",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patient/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Feed de Salud</h1>
            <p className="text-muted-foreground">Contenido educativo de profesionales</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando publicaciones...</div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay publicaciones disponibles
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.profiles.avatar_url} />
                      <AvatarFallback>{post.profiles.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{post.profiles.full_name}</div>
                      <div className="text-sm text-muted-foreground">{post.profiles.specialty}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full rounded-lg object-cover max-h-96"
                    />
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={post.isLiked ? "text-red-500" : ""}
                    >
                      <Heart className={`h-5 w-5 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                      {post.likes_count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadComments(post.id)}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      {post.comments_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {selectedPost === post.id && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.profiles.avatar_url} />
                              <AvatarFallback>
                                {comment.profiles.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-secondary/50 rounded-lg p-3">
                              <div className="font-semibold text-sm">
                                {comment.profiles.full_name}
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Escribe un comentario..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={2}
                        />
                        <Button onClick={() => handleComment(post.id)}>Comentar</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientFeed;
