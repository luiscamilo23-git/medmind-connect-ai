import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Activity, ArrowLeft, Camera, Save, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { SpecialtySelector } from "@/components/SpecialtySelector";
import { MedicalSpecialty } from "@/config/medicalSpecialties";
import { SignaturePad } from "@/components/SignaturePad";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [originalSpecialty, setOriginalSpecialty] = useState<string>("");
  const [profile, setProfile] = useState({
    full_name: "",
    specialty: "" as MedicalSpecialty | "",
    bio: "",
    phone: "",
    license_number: "",
    avatar_url: "",
    signature_url: "",
    notifications_sound_enabled: true
  });
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
      await loadProfile(session.user.id);
    };
    checkUser();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const specialtyValue = data.specialty || "";
        setOriginalSpecialty(specialtyValue);
        setProfile({
          full_name: data.full_name || "",
          specialty: specialtyValue as MedicalSpecialty | "",
          bio: data.bio || "",
          phone: data.phone || "",
          license_number: data.license_number || "",
          avatar_url: data.avatar_url || "",
          signature_url: data.signature_url || "",
          notifications_sound_enabled: data.notifications_sound_enabled ?? true
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      if (!user) return;

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      setUploading(true);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: data.publicUrl });

      toast({
        title: "Foto subida",
        description: "No olvides guardar los cambios",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la foto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-feature rounded-lg flex items-center justify-center shadow-feature">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">Mi Perfil</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Información del Perfil</CardTitle>
            <CardDescription>
              Actualiza tu información profesional y foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.split(" ").map(n => n[0]).join("") || "DR"}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                    {uploading ? "Subiendo..." : "Cambiar Foto"}
                  </div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </Label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Dr. Juan Pérez"
                />
              </div>

              <SpecialtySelector
                value={profile.specialty}
                onChange={(value) => setProfile({ ...profile, specialty: value })}
                showDescription
                showWarning={originalSpecialty !== "" && profile.specialty !== originalSpecialty}
              />

              <div className="space-y-2">
                <Label htmlFor="license_number">Número de Licencia</Label>
                <Input
                  id="license_number"
                  value={profile.license_number}
                  onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                  placeholder="123456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Cuéntanos sobre tu experiencia, formación académica, áreas de interés..."
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Esta información aparecerá en tus publicaciones de la red social
                </p>
              </div>

              {/* Sound Preferences */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {profile.notifications_sound_enabled ? (
                    <Volume2 className="w-5 h-5 text-primary" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="sound-toggle" className="font-medium">
                      Sonidos de Notificación
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Reproduce sonidos al conectar WhatsApp, expiración de QR, etc.
                    </p>
                  </div>
                </div>
                <Switch
                  id="sound-toggle"
                  checked={profile.notifications_sound_enabled}
                  onCheckedChange={(checked) => 
                    setProfile({ ...profile, notifications_sound_enabled: checked })
                  }
                />
              </div>

              {/* Firma Médica */}
              <div className="pt-4 border-t">
                <SignaturePad
                  initialSignature={profile.signature_url}
                  onSignatureChange={(url) => setProfile({ ...profile, signature_url: url || "" })}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Esta firma aparecerá en todas tus historias clínicas y documentos médicos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
