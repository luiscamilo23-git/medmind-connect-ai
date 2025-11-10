import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, Star, MessageSquare, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  avatar_url: string;
  bio: string;
  city: string;
  clinic_name: string;
  years_experience: number;
  consultation_fee: number;
  certifications: string[];
  is_accepting_patients: boolean;
  average_rating: number;
  total_reviews: number;
}

const DoctorExplorer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchTerm, specialtyFilter, cityFilter, doctors]);

  const loadDoctors = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .not("specialty", "is", null);

      if (error) throw error;

      const doctorsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: reviews } = await supabase
            .from("doctor_reviews")
            .select("rating")
            .eq("doctor_id", profile.id);

          const totalReviews = reviews?.length || 0;
          const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

          return {
            ...profile,
            average_rating: averageRating,
            total_reviews: totalReviews,
          } as Doctor;
        })
      );

      setDoctors(doctorsWithStats);
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

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specialtyFilter !== "all") {
      filtered = filtered.filter((d) => d.specialty === specialtyFilter);
    }

    if (cityFilter !== "all") {
      filtered = filtered.filter((d) => d.city === cityFilter);
    }

    setFilteredDoctors(filtered);
  };

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean)));
  const cities = Array.from(new Set(doctors.map((d) => d.city).filter(Boolean)));

  const handleContactDoctor = async (doctorId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    navigate(`/patient/chat?doctor=${doctorId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patient/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Explorar Médicos</h1>
            <p className="text-muted-foreground">Encuentra el especialista ideal para ti</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las ciudades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando médicos...</div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron médicos con los filtros seleccionados
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={doctor.avatar_url} />
                      <AvatarFallback>{doctor.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{doctor.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                      {doctor.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {doctor.city}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctor.clinic_name && (
                    <div className="text-sm">
                      <span className="font-semibold">Clínica:</span> {doctor.clinic_name}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {doctor.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{doctor.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({doctor.total_reviews})</span>
                      </div>
                    )}
                    {doctor.years_experience && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{doctor.years_experience} años</span>
                      </div>
                    )}
                  </div>

                  {doctor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{doctor.bio}</p>
                  )}

                  {doctor.certifications && doctor.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {doctor.certifications.slice(0, 2).map((cert, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {doctor.consultation_fee && (
                      <div className="text-lg font-bold text-primary">
                        ${doctor.consultation_fee}
                      </div>
                    )}
                    <Button
                      onClick={() => handleContactDoctor(doctor.id)}
                      disabled={!doctor.is_accepting_patients}
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contactar
                    </Button>
                  </div>

                  {!doctor.is_accepting_patients && (
                    <Badge variant="secondary" className="w-full justify-center">
                      No acepta nuevos pacientes
                    </Badge>
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

export default DoctorExplorer;
