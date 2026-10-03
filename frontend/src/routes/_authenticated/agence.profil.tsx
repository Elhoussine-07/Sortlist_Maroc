import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Image,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  User,
  CheckCircle,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Award,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Shield,
  TrendingUp,
  Clock,
  Heart,
  Share2,
  MoreVertical,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  FormSkeleton,
  SectionCard,
  StatusBadge,
  TextAreaField,
  TextField,
} from "@/components/common/Blocks";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import type {
  AgencyCertificationItem,
  AgencyPortfolioItem,
  AgencyServiceItem,
  AgencyTeamItem,
} from "@/lib/types";
import { listAgencyMembers, listAgencyReviews } from "@/services/agencies.service";
import { getAgencyProfile, updateAgencyProfile, uploadFile } from "@/services/profile.service";
import { ApiError } from "@/services/http";

const EMPTY_SERVICE: AgencyServiceItem = {
  serviceName: "",
  description: "",
  priceRange: "",
  techStack: "",
  skills: "",
  projectsInProgress: 0,
};

const EMPTY_PORTFOLIO_ITEM: AgencyPortfolioItem = {
  title: "",
  status: "In Progress",
  image: "",
  videoUrl: "",
  resultUrl: "",
  budget: null,
  collaborationPeriod: "",
  agencyFeedback: "",
  problemSolution: "",
  clientConfirmed: false,
};

const EMPTY_TEAM_ITEM: AgencyTeamItem = {
  member: "",
  memberName: "",
  photo: "",
  role: "",
  description: "",
  history: "",
  linkedinUrl: "",
};

const EMPTY_CERTIFICATION: AgencyCertificationItem = {
  photo: "",
  title: "",
  description: "",
  issuingOrganization: "",
  level: "Foundation",
};

function servicesToPayload(items: AgencyServiceItem[]) {
  return items
    .filter((item) => item.serviceName.trim().length > 0)
    .map((item) => ({
      service_name: item.serviceName,
      description: item.description,
      price_range: item.priceRange,
      tech_stack: item.techStack,
      skills: item.skills,
      projects_in_progress: item.projectsInProgress,
    }));
}

function portfolioToPayload(items: AgencyPortfolioItem[]) {
  return items
    .filter((item) => item.title.trim().length > 0)
    .map((item) => ({
      title: item.title,
      status: item.status,
      image: item.image,
      video_url: item.videoUrl,
      result_url: item.resultUrl,
      budget: item.budget,
      collaboration_period: item.collaborationPeriod,
      agency_feedback: item.agencyFeedback,
      problem_solution: item.problemSolution,
      client_confirmed: item.clientConfirmed ? 1 : 0,
    }));
}

function teamToPayload(items: AgencyTeamItem[]) {
  return items
    .filter((item) => item.memberName.trim().length > 0)
    .map((item) => ({
      member: item.member,
      member_name: item.memberName,
      photo: item.photo,
      role: item.role,
      description: item.description,
      history: item.history,
      linkedin_url: item.linkedinUrl,
    }));
}

function certificationsToPayload(items: AgencyCertificationItem[]) {
  return items
    .filter((item) => item.title.trim().length > 0)
    .map((item) => ({
      photo: item.photo,
      title: item.title,
      description: item.description,
      issuing_organization: item.issuingOrganization,
      level: item.level,
    }));
}

const GRADIENT_OPTIONS = [
  "from-violet-500/20 to-purple-500/10",
  "from-blue-500/20 to-cyan-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-rose-500/20 to-pink-500/10",
  "from-amber-500/20 to-orange-500/10",
  "from-indigo-500/20 to-blue-500/10",
] as const;

function getRandomGradient(): string {
  return (
    GRADIENT_OPTIONS[Math.floor(Math.random() * GRADIENT_OPTIONS.length)] ?? GRADIENT_OPTIONS[0]
  );
}

const PAGE_TEXT = {
  "Modifier": {
    en: "Edit",
    ar: "تعديل",
    es: "Editar",
  },
  "Sans titre": {
    en: "Untitled",
    ar: "بدون عنوان",
    es: "Sin título",
  },
  "✨ Profil mis à jour avec succès": {
    en: "✨ Profile updated successfully",
    ar: "✨ تم تحديث الملف الشخصي بنجاح",
    es: "✨ Perfil actualizado correctamente",
  },
  "Mise à jour impossible.": {
    en: "Update failed.",
    ar: "تعذر التحديث.",
    es: "No se pudo actualizar.",
  },
  "🖼️ Logo téléchargé avec succès": {
    en: "🖼️ Logo uploaded successfully",
    ar: "🖼️ تم رفع الشعار بنجاح",
    es: "🖼️ Logo subido correctamente",
  },
  "Téléversement du logo impossible.": {
    en: "Logo upload failed.",
    ar: "تعذر رفع الشعار.",
    es: "No se pudo subir el logo.",
  },
  "🖼️ Photo de couverture téléchargée avec succès": {
    en: "🖼️ Cover photo uploaded successfully",
    ar: "🖼️ تم رفع صورة الغلاف بنجاح",
    es: "🖼️ Foto de portada subida correctamente",
  },
  "Téléversement de la couverture impossible.": {
    en: "Cover photo upload failed.",
    ar: "تعذر رفع صورة الغلاف.",
    es: "No se pudo subir la foto de portada.",
  },
  "🖼️ Image du projet téléchargée avec succès": {
    en: "🖼️ Project image uploaded successfully",
    ar: "🖼️ تم رفع صورة المشروع بنجاح",
    es: "🖼️ Imagen del proyecto subida correctamente",
  },
  "Téléversement de l'image impossible.": {
    en: "Image upload failed.",
    ar: "تعذر رفع الصورة.",
    es: "No se pudo subir la imagen.",
  },
  "🖼️ Photo du membre téléchargée avec succès": {
    en: "🖼️ Member photo uploaded successfully",
    ar: "🖼️ تم رفع صورة العضو بنجاح",
    es: "🖼️ Foto del miembro subida correctamente",
  },
  "Téléversement de la photo impossible.": {
    en: "Photo upload failed.",
    ar: "تعذر رفع الصورة.",
    es: "No se pudo subir la foto.",
  },
  "✅ Services mis à jour avec succès": {
    en: "✅ Services updated successfully",
    ar: "✅ تم تحديث الخدمات بنجاح",
    es: "✅ Servicios actualizados correctamente",
  },
  "✅ Portfolio mis à jour avec succès": {
    en: "✅ Portfolio updated successfully",
    ar: "✅ تم تحديث معرض الأعمال بنجاح",
    es: "✅ Portafolio actualizado correctamente",
  },
  "✅ Équipe mise à jour avec succès": {
    en: "✅ Team updated successfully",
    ar: "✅ تم تحديث الفريق بنجاح",
    es: "✅ Equipo actualizado correctamente",
  },
  "✅ Certificats mis à jour avec succès": {
    en: "✅ Certifications updated successfully",
    ar: "✅ تم تحديث الشهادات بنجاح",
    es: "✅ Certificados actualizados correctamente",
  },
  "Profil agence": {
    en: "Agency profile",
    ar: "الملف الشخصي للوكالة",
    es: "Perfil de la agencia",
  },
  "Gérez la présentation publique de votre agence": {
    en: "Manage your agency's public presentation",
    ar: "أدر العرض العام لوكالتك",
    es: "Gestiona la presentación pública de tu agencia",
  },
  "Identifiant légal vérifié": {
    en: "Legal ID verified",
    ar: "تم التحقق من المعرف القانوني",
    es: "Identificador legal verificado",
  },
  "Présentation": {
    en: "Overview",
    ar: "نظرة عامة",
    es: "Presentación",
  },
  "Nom, description, année de création et taille de l'équipe.": {
    en: "Name, description, founding year, and team size.",
    ar: "الاسم والوصف وسنة التأسيس وحجم الفريق.",
    es: "Nombre, descripción, año de fundación y tamaño del equipo.",
  },
  "Aucune photo de couverture": {
    en: "No cover photo",
    ar: "لا توجد صورة غلاف",
    es: "Sin foto de portada",
  },
  "Envoi...": {
    en: "Uploading...",
    ar: "جارٍ الإرسال...",
    es: "Enviando...",
  },
  "Photo de couverture": {
    en: "Cover photo",
    ar: "صورة الغلاف",
    es: "Foto de portada",
  },
  "Logo": {
    en: "Logo",
    ar: "الشعار",
    es: "Logo",
  },
  "Nom de l'agence": {
    en: "Agency name",
    ar: "اسم الوكالة",
    es: "Nombre de la agencia",
  },
  "Année de création": {
    en: "Founding year",
    ar: "سنة التأسيس",
    es: "Año de fundación",
  },
  "Taille de l'équipe": {
    en: "Team size",
    ar: "حجم الفريق",
    es: "Tamaño del equipo",
  },
  "Site web": {
    en: "Website",
    ar: "الموقع الإلكتروني",
    es: "Sitio web",
  },
  "Localisation": {
    en: "Location",
    ar: "الموقع",
    es: "Ubicación",
  },
  "Identifiant légal": {
    en: "Legal ID",
    ar: "المعرف القانوني",
    es: "Identificador legal",
  },
  "Description de l'agence": {
    en: "Agency description",
    ar: "وصف الوكالة",
    es: "Descripción de la agencia",
  },
  "COORDONNÉES": {
    en: "CONTACT DETAILS",
    ar: "معلومات التواصل",
    es: "DATOS DE CONTACTO",
  },
  "Indicatif pays": {
    en: "Country code",
    ar: "رمز الدولة",
    es: "Código de país",
  },
  "Téléphone": {
    en: "Phone",
    ar: "الهاتف",
    es: "Teléfono",
  },
  "E-mail": {
    en: "Email",
    ar: "البريد الإلكتروني",
    es: "Correo electrónico",
  },
  "Adresse": {
    en: "Address",
    ar: "العنوان",
    es: "Dirección",
  },
  "Enregistrement...": {
    en: "Saving...",
    ar: "جارٍ الحفظ...",
    es: "Guardando...",
  },
  "Enregistrer les modifications": {
    en: "Save changes",
    ar: "حفظ التغييرات",
    es: "Guardar cambios",
  },
  "Prestation (Services)": {
    en: "Services offered",
    ar: "الخدمات المقدمة",
    es: "Servicios ofrecidos",
  },
  "Services proposés, utilisés pour le matching avec les projets clients.": {
    en: "Services offered, used to match you with client projects.",
    ar: "الخدمات المقدمة، وتُستخدم لمطابقتك بمشاريع العملاء.",
    es: "Servicios ofrecidos, utilizados para la coincidencia con los proyectos de los clientes.",
  },
  "Ajouter un service": {
    en: "Add a service",
    ar: "إضافة خدمة",
    es: "Añadir un servicio",
  },
  "Aucun service renseigné.": {
    en: "No services added yet.",
    ar: "لم تتم إضافة أي خدمة بعد.",
    es: "Aún no se ha añadido ningún servicio.",
  },
  "projets": {
    en: "projects",
    ar: "مشاريع",
    es: "proyectos",
  },
  "Nom du service": {
    en: "Service name",
    ar: "اسم الخدمة",
    es: "Nombre del servicio",
  },
  "Fourchette de prix": {
    en: "Price range",
    ar: "نطاق السعر",
    es: "Rango de precios",
  },
  "Stack technique": {
    en: "Tech stack",
    ar: "التقنيات المستخدمة",
    es: "Stack tecnológico",
  },
  "Compétences": {
    en: "Skills",
    ar: "المهارات",
    es: "Habilidades",
  },
  "Description": {
    en: "Description",
    ar: "الوصف",
    es: "Descripción",
  },
  "Terminé": {
    en: "Done",
    ar: "تم",
    es: "Hecho",
  },
  "Retirer": {
    en: "Remove",
    ar: "إزالة",
    es: "Quitar",
  },
  "Enregistrer les services": {
    en: "Save services",
    ar: "حفظ الخدمات",
    es: "Guardar servicios",
  },
  "Portfolio": {
    en: "Portfolio",
    ar: "معرض الأعمال",
    es: "Portafolio",
  },
  "Réalisations présentées aux clients.": {
    en: "Work showcased to clients.",
    ar: "الأعمال المعروضة على العملاء.",
    es: "Trabajos mostrados a los clientes.",
  },
  "Ajouter un projet": {
    en: "Add a project",
    ar: "إضافة مشروع",
    es: "Añadir un proyecto",
  },
  "Aucune réalisation renseignée. Ajoutez un projet réalisé pour un client — y compris un projet externe à la plateforme.": {
    en: "No work added yet. Add a project completed for a client — including one from outside the platform.",
    ar: "لم تتم إضافة أي عمل بعد. أضف مشروعًا أنجزته لعميل — بما في ذلك مشروع خارج المنصة.",
    es: "Aún no se ha añadido ningún trabajo. Añade un proyecto realizado para un cliente, incluso uno externo a la plataforma.",
  },
  "Image du projet": {
    en: "Project image",
    ar: "صورة المشروع",
    es: "Imagen del proyecto",
  },
  "Titre": {
    en: "Title",
    ar: "العنوان",
    es: "Título",
  },
  "Période de collaboration": {
    en: "Collaboration period",
    ar: "فترة التعاون",
    es: "Período de colaboración",
  },
  "Budget (€)": {
    en: "Budget (€)",
    ar: "الميزانية (€)",
    es: "Presupuesto (€)",
  },
  "Lien vers le résultat": {
    en: "Link to the result",
    ar: "رابط النتيجة",
    es: "Enlace al resultado",
  },
  "https://...": {
    en: "https://...",
    ar: "https://...",
    es: "https://...",
  },
  "Enregistrer le portfolio": {
    en: "Save portfolio",
    ar: "حفظ معرض الأعمال",
    es: "Guardar portafolio",
  },
  "Staff (Équipe)": {
    en: "Staff (Team)",
    ar: "الفريق (الموظفون)",
    es: "Personal (Equipo)",
  },
  "Membres de l'agence affichés sur le profil public.": {
    en: "Agency members shown on the public profile.",
    ar: "أعضاء الوكالة الظاهرون في الملف الشخصي العام.",
    es: "Miembros de la agencia que aparecen en el perfil público.",
  },
  "Ajouter un membre": {
    en: "Add a member",
    ar: "إضافة عضو",
    es: "Añadir un miembro",
  },
  "Aucun membre renseigné.": {
    en: "No members added yet.",
    ar: "لم تتم إضافة أي عضو بعد.",
    es: "Aún no se ha añadido ningún miembro.",
  },
  "Membre": {
    en: "Member",
    ar: "عضو",
    es: "Miembro",
  },
  "Photo": {
    en: "Photo",
    ar: "الصورة",
    es: "Foto",
  },
  "Collaborateur": {
    en: "Collaborator",
    ar: "المتعاون",
    es: "Colaborador",
  },
  "Sélectionner un membre": {
    en: "Select a member",
    ar: "اختر عضوًا",
    es: "Selecciona un miembro",
  },
  "Nom affiché": {
    en: "Displayed name",
    ar: "الاسم المعروض",
    es: "Nombre mostrado",
  },
  "Rôle affiché": {
    en: "Displayed role",
    ar: "الدور المعروض",
    es: "Rol mostrado",
  },
  "Enregistrer l'équipe": {
    en: "Save team",
    ar: "حفظ الفريق",
    es: "Guardar equipo",
  },
  "Certificats": {
    en: "Certifications",
    ar: "الشهادات",
    es: "Certificados",
  },
  "Certifications mises en avant sur le profil public.": {
    en: "Certifications highlighted on the public profile.",
    ar: "الشهادات المبرزة في الملف الشخصي العام.",
    es: "Certificaciones destacadas en el perfil público.",
  },
  "Ajouter un certificat": {
    en: "Add a certification",
    ar: "إضافة شهادة",
    es: "Añadir un certificado",
  },
  "Aucun certificat renseigné.": {
    en: "No certifications added yet.",
    ar: "لم تتم إضافة أي شهادة بعد.",
    es: "Aún no se ha añadido ningún certificado.",
  },
  "Organisme émetteur": {
    en: "Issuing organization",
    ar: "الجهة المانحة",
    es: "Organismo emisor",
  },
  "Enregistrer les certificats": {
    en: "Save certifications",
    ar: "حفظ الشهادات",
    es: "Guardar certificados",
  },
  "Avis": {
    en: "Reviews",
    ar: "التقييمات",
    es: "Reseñas",
  },
  "Avis déposés par vos clients sur des projets terminés.": {
    en: "Reviews left by your clients on completed projects.",
    ar: "التقييمات التي تركها عملاؤك على المشاريع المنجزة.",
    es: "Reseñas dejadas por tus clientes en proyectos finalizados.",
  },
  "Aucun avis pour le moment.": {
    en: "No reviews yet.",
    ar: "لا توجد تقييمات حتى الآن.",
    es: "Aún no hay reseñas.",
  },
  "Projet : ": {
    en: "Project: ",
    ar: "المشروع: ",
    es: "Proyecto: ",
  },
  "Aperçu public": {
    en: "Public preview",
    ar: "المعاينة العامة",
    es: "Vista previa pública",
  },
  "Ce que voient les clients sur votre fiche agence.": {
    en: "What clients see on your agency profile.",
    ar: "ما يراه العملاء في بطاقة وكالتك.",
    es: "Lo que ven los clientes en la ficha de tu agencia.",
  },
  "Aucune donnée disponible": {
    en: "No data available",
    ar: "لا توجد بيانات متاحة",
    es: "No hay datos disponibles",
  },
  "Créée en ": {
    en: "Founded in ",
    ar: "تأسست عام ",
    es: "Fundada en ",
  },
  " membres": {
    en: " members",
    ar: " أعضاء",
    es: " miembros",
  },
} satisfies PageTextDict;

function CollapsedItemCard({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  onEdit,
  onRemove,
  badge,
}: {
  title: string;
  subtitle?: string | undefined;
  avatarUrl?: string | undefined;
  avatarFallback: ReactNode;
  onEdit: () => void;
  onRemove: () => void;
  badge?: string | undefined;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [gradientClass] = useState(getRandomGradient);
  const { tt } = usePageText(PAGE_TEXT);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient animation */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradientClass} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl border-2 border-border object-cover transition-all duration-300 group-hover:scale-110 group-hover:border-primary/30 group-hover:shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                {avatarFallback}
              </div>
            )}
            {badge && (
              <div className="absolute -top-1 -right-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold text-primary">
                {badge}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold group-hover:text-primary transition-colors duration-300">
              {title || tt("Sans titre")}
            </p>
            {subtitle ? (
              <p className="truncate text-[12.5px] text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/30" />
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 transition-all duration-300">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
          >
            <Pencil
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12"
              strokeWidth={1.8}
            />
            {tt("Modifier")}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-[12.5px] font-semibold text-destructive transition-all duration-300 hover:border-red-200 hover:bg-red-50 hover:shadow-sm hover:scale-105"
          >
            <Trash2
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110"
              strokeWidth={1.8}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/agence/profil")({
  head: () => ({
    meta: [
      { title: "Profil agence — Sortlist Pro" },
      {
        name: "description",
        content:
          "Gérez la présentation de votre agence, vos compétences, votre portfolio et vos coordonnées.",
      },
      { property: "og:title", content: "Profil agence — Sortlist Pro" },
      {
        property: "og:description",
        content: "Profil public de votre agence sur Sortlist Pro.",
      },
    ],
  }),
  component: AgencyProfilePage,
});

const profileSchema = z.object({
  name: z.string().trim().min(1, "Champ requis").max(120),
  description: z.string().trim().min(1, "Champ requis").max(2000),
  foundedYear: z.string().trim().min(4, "Année invalide").max(4),
  teamSize: z.string().trim().min(1, "Champ requis").max(40),
  website: z.string().trim().url("URL invalide").max(255),
  location: z.string().trim().min(1, "Champ requis").max(120),
  legalIdValue: z.string().trim().min(1, "Champ requis").max(80),
  phoneCountryCode: z.string().trim().min(1, "Champ requis").max(6),
  phone: z.string().trim().min(1, "Champ requis").max(30),
  email: z.string().trim().email("E-mail invalide").max(255),
  address: z.string().trim().min(1, "Champ requis").max(255),
});

type ProfileForm = z.infer<typeof profileSchema>;

function AgencyProfilePage() {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["agency", "profile"],
    queryFn: getAgencyProfile,
  });
  const profile = profileQuery.data ?? null;
  const isLoading = profileQuery.isLoading;

  const isPortfolioLoading = isLoading;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      description: "",
      foundedYear: "",
      teamSize: "",
      website: "",
      location: "",
      legalIdValue: "",
      phoneCountryCode: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      name: profile.name,
      description: profile.description,
      foundedYear: profile.foundedYear,
      teamSize: profile.teamSize,
      website: profile.website,
      location: profile.location,
      legalIdValue: profile.legalIdValue,
      phoneCountryCode: profile.phoneCountryCode,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateAgencyProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success(tt("✨ Profil mis à jour avec succès"));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tt("Mise à jour impossible."));
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(values);
  });

  const [services, setServices] = useState<AgencyServiceItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<AgencyPortfolioItem[]>([]);
  const [team, setTeam] = useState<AgencyTeamItem[]>([]);
  const [certifications, setCertifications] = useState<AgencyCertificationItem[]>([]);

  const [servicesEditing, setServicesEditing] = useState<boolean[]>([]);
  const [portfolioEditing, setPortfolioEditing] = useState<boolean[]>([]);
  const [teamEditing, setTeamEditing] = useState<boolean[]>([]);
  const [certificationsEditing, setCertificationsEditing] = useState<boolean[]>([]);

  useEffect(() => {
    if (!profile) return;
    setServices(profile.services ?? []);
    setPortfolioItems(profile.portfolio ?? []);
    setTeam(profile.team ?? []);
    setCertifications(profile.certifications ?? []);
    setServicesEditing((profile.services ?? []).map(() => false));
    setPortfolioEditing((profile.portfolio ?? []).map(() => false));
    setTeamEditing((profile.team ?? []).map(() => false));
    setCertificationsEditing((profile.certifications ?? []).map(() => false));
  }, [profile]);

  const [uploadingPortfolioIndex, setUploadingPortfolioIndex] = useState<number | null>(null);
  const [uploadingTeamIndex, setUploadingTeamIndex] = useState<number | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  async function handleUploadLogo(file: File) {
    setIsUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      updateMutation.mutate({ logo: url });
      toast.success(tt("🖼️ Logo téléchargé avec succès"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tt("Téléversement du logo impossible."));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleUploadCoverImage(file: File) {
    setIsUploadingCover(true);
    try {
      const url = await uploadFile(file);
      updateMutation.mutate({ coverImage: url });
      toast.success(tt("🖼️ Photo de couverture téléchargée avec succès"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tt("Téléversement de la couverture impossible."),
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleUploadPortfolioImage(index: number, file: File) {
    setUploadingPortfolioIndex(index);
    try {
      const url = await uploadFile(file);
      setPortfolioItems((current) =>
        current.map((row, i) => (i === index ? { ...row, image: url } : row)),
      );
      toast.success(tt("🖼️ Image du projet téléchargée avec succès"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tt("Téléversement de l'image impossible."));
    } finally {
      setUploadingPortfolioIndex(null);
    }
  }

  async function handleUploadTeamPhoto(index: number, file: File) {
    setUploadingTeamIndex(index);
    try {
      const url = await uploadFile(file);
      setTeam((current) => current.map((row, i) => (i === index ? { ...row, photo: url } : row)));
      toast.success(tt("🖼️ Photo du membre téléchargée avec succès"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tt("Téléversement de la photo impossible."));
    } finally {
      setUploadingTeamIndex(null);
    }
  }

  const membersQuery = useQuery({
    queryKey: ["agency", "members"],
    queryFn: listAgencyMembers,
  });

  const reviewsQuery = useQuery({
    queryKey: ["agency", "profile", "reviews", profile?.id],
    queryFn: () => listAgencyReviews(profile!.id),
    enabled: Boolean(profile?.id),
  });

  const servicesMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ services: servicesToPayload(services) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success(tt("✅ Services mis à jour avec succès"));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tt("Mise à jour impossible."));
    },
  });

  const portfolioMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ portfolio: portfolioToPayload(portfolioItems) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success(tt("✅ Portfolio mis à jour avec succès"));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tt("Mise à jour impossible."));
    },
  });

  const teamMutation = useMutation({
    mutationFn: () => updateAgencyProfile({ team: teamToPayload(team) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success(tt("✅ Équipe mise à jour avec succès"));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tt("Mise à jour impossible."));
    },
  });

  const certificationsMutation = useMutation({
    mutationFn: () =>
      updateAgencyProfile({ certifications: certificationsToPayload(certifications) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["agency", "profile"], updated);
      toast.success(tt("✅ Certificats mis à jour avec succès"));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tt("Mise à jour impossible."));
    },
  });

  return (
    <DashboardShell role="agency">
      <div className="mx-auto max-w-[1080px] space-y-8">
        {/* En-tête amélioré avec animation */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 animate-in slide-in-from-top duration-500">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl animate-pulse delay-1000" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30 animate-in zoom-in duration-500">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-[26px] font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {tt("Profil agence")}
                </h1>
                <p className="mt-0.5 text-[14px] text-muted-foreground flex items-center gap-1.5">
                  {tt("Gérez la présentation publique de votre agence")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center animate-in fade-in slide-in-from-right duration-500">
              {profile?.legalIdValid && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3.5 py-1.5 shadow-sm shadow-green-200/50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-[13px] font-medium text-green-700">
                    {tt("Identifiant légal vérifié")}
                  </span>
                </div>
              )}
              <button className="rounded-lg border border-border p-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <SectionCard
          title={tt("Présentation")}
          description={tt("Nom, description, année de création et taille de l'équipe.")}
        >
          {isLoading ? (
            <FormSkeleton fields={6} />
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <div className="space-y-4">
                <div className="relative h-44 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
                  {profile?.coverImage ? (
                    <img
                      src={profile.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30">
                      <Image className="h-16 w-16" strokeWidth={0.8} />
                      <span className="mt-2 text-sm">{tt("Aucune photo de couverture")}</span>
                    </div>
                  )}
                  <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/90 px-3.5 py-2 text-[12.5px] font-semibold shadow-sm transition-all hover:bg-accent hover:shadow-md hover:scale-105">
                    <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {isUploadingCover ? tt("Envoi...") : tt("Photo de couverture")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingCover}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadCoverImage(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="relative -mt-12 flex items-end gap-4 pl-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                    {profile?.logo ? (
                      <img src={profile.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8" strokeWidth={1.6} />
                    )}
                  </div>
                  <label className="mb-1 flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/90 px-3.5 py-2 text-[12.5px] font-semibold shadow-sm transition-all hover:bg-accent hover:shadow-md hover:scale-105">
                    <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {isUploadingLogo ? tt("Envoi...") : tt("Logo")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingLogo}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadLogo(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label={tt("Nom de l'agence")}
                  error={form.formState.errors.name?.message}
                  {...form.register("name")}
                />
                <TextField
                  label={tt("Année de création")}
                  error={form.formState.errors.foundedYear?.message}
                  {...form.register("foundedYear")}
                />
                <TextField
                  label={tt("Taille de l'équipe")}
                  error={form.formState.errors.teamSize?.message}
                  {...form.register("teamSize")}
                />
                <TextField
                  label={tt("Site web")}
                  error={form.formState.errors.website?.message}
                  {...form.register("website")}
                />
                <TextField
                  label={tt("Localisation")}
                  error={form.formState.errors.location?.message}
                  {...form.register("location")}
                />
                <TextField
                  label={tt("Identifiant légal")}
                  error={form.formState.errors.legalIdValue?.message}
                  {...form.register("legalIdValue")}
                />
              </div>

              <TextAreaField
                label={tt("Description de l'agence")}
                rows={5}
                error={form.formState.errors.description?.message}
                {...form.register("description")}
              />

              <div className="border-t border-border pt-4">
                <h3 className="mb-4 flex items-center gap-2 text-[13.5px] font-bold tracking-wide">
                  <Layers className="h-4 w-4 text-primary" />
                  {tt("COORDONNÉES")}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label={tt("Indicatif pays")}
                    error={form.formState.errors.phoneCountryCode?.message}
                    {...form.register("phoneCountryCode")}
                  />
                  <TextField
                    label={tt("Téléphone")}
                    error={form.formState.errors.phone?.message}
                    {...form.register("phone")}
                  />
                  <TextField
                    label={tt("E-mail")}
                    error={form.formState.errors.email?.message}
                    {...form.register("email")}
                  />
                  <TextField
                    label={tt("Adresse")}
                    error={form.formState.errors.address?.message}
                    {...form.register("address")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {tt("Enregistrement...")}
                    </>
                  ) : (
                    <>{tt("Enregistrer les modifications")}</>
                  )}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* CDC §2.2.2 — Prestation (Services). */}
        <SectionCard
          title={tt("Prestation (Services)")}
          description={tt("Services proposés, utilisés pour le matching avec les projets clients.")}
          action={
            <button
              type="button"
              onClick={() => {
                setServices((current) => [...current, { ...EMPTY_SERVICE }]);
                setServicesEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              {tt("Ajouter un service")}
            </button>
          }
        >
          {isLoading ? (
            <StackSkeleton count={2} />
          ) : (
            <div className="space-y-5">
              {services.length === 0 ? <EmptyState message={tt("Aucun service renseigné.")} /> : null}
              {services.map((service, index) =>
                !servicesEditing[index] ? (
                  <CollapsedItemCard
                    key={index}
                    title={service.serviceName}
                    subtitle={service.priceRange || undefined}
                    avatarFallback={
                      service.serviceName ? service.serviceName[0]?.toUpperCase() : "?"
                    }
                    badge={
                      service.projectsInProgress > 0
                        ? `${service.projectsInProgress} ${tt("projets")}`
                        : undefined
                    }
                    onEdit={() =>
                      setServicesEditing((current) =>
                        current.map((v, i) => (i === index ? true : v)),
                      )
                    }
                    onRemove={() => {
                      setServices((current) => current.filter((_, i) => i !== index));
                      setServicesEditing((current) => current.filter((_, i) => i !== index));
                    }}
                  />
                ) : (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        label={tt("Nom du service")}
                        value={service.serviceName}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, serviceName: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label={tt("Fourchette de prix")}
                        value={service.priceRange}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, priceRange: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label={tt("Stack technique")}
                        value={service.techStack}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, techStack: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label={tt("Compétences")}
                        value={service.skills}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, skills: event.target.value } : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <TextAreaField
                      label={tt("Description")}
                      rows={3}
                      value={service.description}
                      onChange={(event) =>
                        setServices((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, description: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setServicesEditing((current) =>
                            current.map((v, i) => (i === index ? false : v)),
                          )
                        }
                        className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                      >
                        <CheckCircle className="inline h-4 w-4 mr-1.5" />
                        {tt("Terminé")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setServices((current) => current.filter((_, i) => i !== index));
                          setServicesEditing((current) => current.filter((_, i) => i !== index));
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        {tt("Retirer")}
                      </button>
                    </div>
                  </div>
                ),
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => servicesMutation.mutate()}
                  disabled={servicesMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {servicesMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {tt("Enregistrement...")}
                    </>
                  ) : (
                    tt("Enregistrer les services")
                  )}
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* CDC §2.2.3 — Réalisation (Portfolio). */}
        <SectionCard
          title={tt("Portfolio")}
          description={tt("Réalisations présentées aux clients.")}
          action={
            <button
              type="button"
              onClick={() => {
                setPortfolioItems((current) => [...current, { ...EMPTY_PORTFOLIO_ITEM }]);
                setPortfolioEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              {tt("Ajouter un projet")}
            </button>
          }
        >
          {isPortfolioLoading ? (
            <StackSkeleton count={3} />
          ) : (
            <div className="space-y-5">
              {portfolioItems.length === 0 ? (
                <EmptyState message={tt("Aucune réalisation renseignée. Ajoutez un projet réalisé pour un client — y compris un projet externe à la plateforme.")} />
              ) : null}
              {portfolioItems.map((item, index) =>
                !portfolioEditing[index] ? (
                  <CollapsedItemCard
                    key={index}
                    title={item.title}
                    subtitle={item.collaborationPeriod || undefined}
                    avatarUrl={item.image || undefined}
                    avatarFallback={<Image className="h-4 w-4" strokeWidth={1.7} />}
                    onEdit={() =>
                      setPortfolioEditing((current) =>
                        current.map((v, i) => (i === index ? true : v)),
                      )
                    }
                    onRemove={() => {
                      setPortfolioItems((current) => current.filter((_, i) => i !== index));
                      setPortfolioEditing((current) => current.filter((_, i) => i !== index));
                    }}
                  />
                ) : (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                  >
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover transition-transform duration-300 hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
                          <Image className="h-6 w-6" strokeWidth={1.6} />
                        </div>
                      )}
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm">
                        <Upload className="h-4 w-4" strokeWidth={1.8} />
                        {uploadingPortfolioIndex === index ? tt("Envoi...") : tt("Image du projet")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPortfolioIndex === index}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleUploadPortfolioImage(index, file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        label={tt("Titre")}
                        value={item.title}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, title: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label={tt("Période de collaboration")}
                        value={item.collaborationPeriod}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index
                                ? { ...row, collaborationPeriod: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label={tt("Budget (€)")}
                        type="number"
                        value={item.budget ?? ""}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index
                                ? {
                                    ...row,
                                    budget: event.target.value ? Number(event.target.value) : null,
                                  }
                                : row,
                            ),
                          )
                        }
                      />
                      <TextField
                        label={tt("Lien vers le résultat")}
                        placeholder={tt("https://...")}
                        value={item.resultUrl}
                        onChange={(event) =>
                          setPortfolioItems((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, resultUrl: event.target.value } : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPortfolioEditing((current) =>
                            current.map((v, i) => (i === index ? false : v)),
                          )
                        }
                        className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                      >
                        <CheckCircle className="inline h-4 w-4 mr-1.5" />
                        {tt("Terminé")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioItems((current) => current.filter((_, i) => i !== index));
                          setPortfolioEditing((current) => current.filter((_, i) => i !== index));
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        {tt("Retirer")}
                      </button>
                    </div>
                  </div>
                ),
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => portfolioMutation.mutate()}
                  disabled={portfolioMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {portfolioMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {tt("Enregistrement...")}
                    </>
                  ) : (
                    tt("Enregistrer le portfolio")
                  )}
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* CDC §2.2.4 — Staff (Équipe). */}
        <SectionCard
          title={tt("Staff (Équipe)")}
          description={tt("Membres de l'agence affichés sur le profil public.")}
          action={
            <button
              type="button"
              onClick={() => {
                setTeam((current) => [...current, { ...EMPTY_TEAM_ITEM }]);
                setTeamEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              {tt("Ajouter un membre")}
            </button>
          }
        >
          <div className="space-y-5">
            {team.length === 0 ? <EmptyState message={tt("Aucun membre renseigné.")} /> : null}
            {team.map((member, index) =>
              !teamEditing[index] ? (
                <CollapsedItemCard
                  key={index}
                  title={member.memberName || tt("Membre")}
                  subtitle={member.role || undefined}
                  avatarUrl={member.photo || undefined}
                  avatarFallback={<User className="h-4 w-4" strokeWidth={1.7} />}
                  onEdit={() =>
                    setTeamEditing((current) => current.map((v, i) => (i === index ? true : v)))
                  }
                  onRemove={() => {
                    setTeam((current) => current.filter((_, i) => i !== index));
                    setTeamEditing((current) => current.filter((_, i) => i !== index));
                  }}
                />
              ) : (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                >
                  <div className="flex items-center gap-4">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-full border-2 border-border object-cover transition-transform duration-300 hover:scale-110 hover:shadow-xl"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
                        <User className="h-6 w-6" strokeWidth={1.6} />
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm">
                      <Upload className="h-4 w-4" strokeWidth={1.8} />
                      {uploadingTeamIndex === index ? tt("Envoi...") : tt("Photo")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingTeamIndex === index}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleUploadTeamPhoto(index, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[13px] font-semibold">{tt("Collaborateur")}</label>
                      <select
                        value={member.member}
                        onChange={(event) =>
                          setTeam((current) =>
                            current.map((row, i) =>
                              i === index ? { ...row, member: event.target.value } : row,
                            ),
                          )
                        }
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13.5px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">{tt("Sélectionner un membre")}</option>
                        {(membersQuery.data ?? []).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.user} ({option.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <TextField
                      label={tt("Nom affiché")}
                      value={member.memberName}
                      onChange={(event) =>
                        setTeam((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, memberName: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <TextField
                      label={tt("Rôle affiché")}
                      value={member.role}
                      onChange={(event) =>
                        setTeam((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, role: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <TextAreaField
                    label={tt("Description")}
                    rows={2}
                    value={member.description}
                    onChange={(event) =>
                      setTeam((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, description: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setTeamEditing((current) =>
                          current.map((v, i) => (i === index ? false : v)),
                        )
                      }
                      className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                    >
                      <CheckCircle className="inline h-4 w-4 mr-1.5" />
                      {tt("Terminé")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeam((current) => current.filter((_, i) => i !== index));
                        setTeamEditing((current) => current.filter((_, i) => i !== index));
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      {tt("Retirer")}
                    </button>
                  </div>
                </div>
              ),
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => teamMutation.mutate()}
                disabled={teamMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {teamMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {tt("Enregistrement...")}
                  </>
                ) : (
                  tt("Enregistrer l'équipe")
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* CDC §2.2.5 — Certificats. */}
        <SectionCard
          title={tt("Certificats")}
          description={tt("Certifications mises en avant sur le profil public.")}
          action={
            <button
              type="button"
              onClick={() => {
                setCertifications((current) => [...current, { ...EMPTY_CERTIFICATION }]);
                setCertificationsEditing((current) => [...current, true]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              {tt("Ajouter un certificat")}
            </button>
          }
        >
          <div className="space-y-5">
            {certifications.length === 0 ? (
              <EmptyState message={tt("Aucun certificat renseigné.")} />
            ) : null}
            {certifications.map((cert, index) =>
              !certificationsEditing[index] ? (
                <CollapsedItemCard
                  key={index}
                  title={cert.title}
                  subtitle={cert.issuingOrganization || undefined}
                  avatarUrl={cert.photo || undefined}
                  avatarFallback={cert.title ? cert.title[0]?.toUpperCase() : "?"}
                  onEdit={() =>
                    setCertificationsEditing((current) =>
                      current.map((v, i) => (i === index ? true : v)),
                    )
                  }
                  onRemove={() => {
                    setCertifications((current) => current.filter((_, i) => i !== index));
                    setCertificationsEditing((current) => current.filter((_, i) => i !== index));
                  }}
                />
              ) : (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background/50 p-5 space-y-4 animate-in fade-in slide-in-from-left duration-300"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label={tt("Titre")}
                      value={cert.title}
                      onChange={(event) =>
                        setCertifications((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, title: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <TextField
                      label={tt("Organisme émetteur")}
                      value={cert.issuingOrganization}
                      onChange={(event) =>
                        setCertifications((current) =>
                          current.map((row, i) =>
                            i === index ? { ...row, issuingOrganization: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <TextAreaField
                    label={tt("Description")}
                    rows={2}
                    value={cert.description}
                    onChange={(event) =>
                      setCertifications((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, description: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCertificationsEditing((current) =>
                          current.map((v, i) => (i === index ? false : v)),
                        )
                      }
                      className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:scale-105"
                    >
                      <CheckCircle className="inline h-4 w-4 mr-1.5" />
                      {tt("Terminé")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCertifications((current) => current.filter((_, i) => i !== index));
                        setCertificationsEditing((current) =>
                          current.filter((_, i) => i !== index),
                        );
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-[13px] font-semibold text-destructive transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      {tt("Retirer")}
                    </button>
                  </div>
                </div>
              ),
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => certificationsMutation.mutate()}
                disabled={certificationsMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {certificationsMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {tt("Enregistrement...")}
                  </>
                ) : (
                  tt("Enregistrer les certificats")
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* CDC §2.2.6 — Avis (lecture seule : déposés uniquement par un client
            ayant terminé un projet avec l'agence, cf. review.py). */}
        <SectionCard
          title={tt("Avis")}
          description={tt("Avis déposés par vos clients sur des projets terminés.")}
        >
          {reviewsQuery.isPending ? (
            <StackSkeleton count={2} />
          ) : (reviewsQuery.data ?? []).length === 0 ? (
            <EmptyState message={tt("Aucun avis pour le moment.")} />
          ) : (
            <ul className="space-y-4">
              {(reviewsQuery.data ?? []).map((review, idx) => (
                <li
                  key={review.id}
                  className="group rounded-xl border border-border bg-background/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 transition-all duration-300 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400 scale-100"
                                : "text-muted-foreground/20 scale-95"
                            }`}
                            strokeWidth={0}
                          />
                        ))}
                      </div>
                      <p className="text-[13.5px] font-bold group-hover:text-primary transition-colors">
                        {review.authorName}
                      </p>
                    </div>
                    <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {review.publishedAt}
                    </p>
                  </div>
                  {review.projectTitle ? (
                    <p className="mt-2 text-[12px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      {tt("Projet : ")}{review.projectTitle}
                    </p>
                  ) : null}
                  <p className="mt-2.5 text-[13px] text-muted-foreground leading-relaxed">
                    "{review.comment}"
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={tt("Aperçu public")}
          description={tt("Ce que voient les clients sur votre fiche agence.")}
        >
          {profile === null ? (
            <EmptyState message={tt("Aucune donnée disponible")} />
          ) : (
            <div className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Building2 className="h-6 w-6 text-primary" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold group-hover:text-primary transition-colors duration-300">
                    {profile.name}
                  </p>
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:scale-105"
                      >
                        <Globe className="h-3 w-3" />
                        {tt("Site web")}
                      </a>
                    )}
                    {profile.email && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {profile.email}
                      </span>
                    )}
                    {profile.phone && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {profile.phone}
                      </span>
                    )}
                    {profile.foundedYear && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {tt("Créée en ")}{profile.foundedYear}
                      </span>
                    )}
                    {profile.teamSize && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {profile.teamSize}{tt(" membres")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-muted-foreground/20 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
                  <ExternalLink className="h-5 w-5" />
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
