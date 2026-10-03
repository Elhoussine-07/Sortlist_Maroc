import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  SearchInput,
  SectionCard,
  StatusTabs,
  StatusBadge,
  TextAreaField,
} from "@/components/common/Blocks";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionModal } from "@/components/common/ActionModal";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/services/http";
import {
  approveSuspensionAsModerator,
  contactDisputeClient,
  listPendingLitigeNotices,
  listPendingSuspensions,
  refuseSuspensionAsModerator,
  resolveDispute,
  resolveLitigeNotice,
  type LitigeNoticeCase,
  type ModerationCase,
} from "@/services/moderation.service";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/_authenticated/admin/litiges")({
  head: () => ({
    meta: [{ title: "Litiges & suspensions — Administration" }],
  }),
  component: AdminLitigesPage,
});

const TABS = [
  { value: "all", label: "Tous" },
  { value: "dispute", label: "Litiges" },
  { value: "amicable", label: "Suspensions amiables" },
] as const;

function describeNoticeDeadline(deadline: string | null, tt: (source: string) => string): string {
  if (!deadline) return "";
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return tt("Délai dépassé");
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${hours}h${minutes.toString().padStart(2, "0")} ${tt("restantes pour l'agence")}`;
}

const PAGE_TEXT = {
  "Tous": {
    en: "All",
    ar: "الكل",
    es: "Todos",
  },
  "Litiges": {
    en: "Disputes",
    ar: "النزاعات",
    es: "Disputas",
  },
  "Suspensions amiables": {
    en: "Amicable suspensions",
    ar: "التعليقات الودية",
    es: "Suspensiones amistosas",
  },
  "Délai dépassé": {
    en: "Deadline passed",
    ar: "انتهت المهلة",
    es: "Plazo vencido",
  },
  "restantes pour l'agence": {
    en: "remaining for the agency",
    ar: "متبقية أمام الوكالة",
    es: "restantes para la agencia",
  },
  "Litige tranché : fondé — pour un litige déposé par l'agence, le projet est rejeté immédiatement ; pour un litige déposé par le client, l'agence dispose désormais d'un délai de réponse avant décision finale (cf. section « Litiges en préavis »).": {
    en: "Dispute resolved: upheld — for a dispute filed by the agency, the project is rejected immediately; for a dispute filed by the client, the agency now has a response deadline before a final decision (see the \"Disputes under notice\" section).",
    ar: "تم الفصل في النزاع: مؤسَّس — بالنسبة لنزاع رفعته الوكالة، يُرفض المشروع فورًا؛ أما بالنسبة لنزاع رفعه العميل، فتحصل الوكالة الآن على مهلة للرد قبل القرار النهائي (انظر قسم \"النزاعات قيد الإشعار\").",
    es: "Disputa resuelta: fundada — para una disputa presentada por la agencia, el proyecto se rechaza de inmediato; para una disputa presentada por el cliente, la agencia dispone ahora de un plazo de respuesta antes de la decisión final (ver la sección \"Disputas en preaviso\").",
  },
  "Litige tranché : non fondé — le projet reprend son cours normal.": {
    en: "Dispute resolved: not upheld — the project resumes as normal.",
    ar: "تم الفصل في النزاع: غير مؤسَّس — يستأنف المشروع مساره الطبيعي.",
    es: "Disputa resuelta: no fundada — el proyecto continúa su curso normal.",
  },
  "Impossible d'enregistrer le verdict.": {
    en: "Unable to save the verdict.",
    ar: "تعذّر حفظ القرار.",
    es: "No se pudo guardar el veredicto.",
  },
  "Client contacté — un email et une notification lui ont été envoyés.": {
    en: "Client contacted — an email and a notification have been sent.",
    ar: "تم التواصل مع العميل — تم إرسال بريد إلكتروني وإشعار إليه.",
    es: "Cliente contactado — se le han enviado un correo electrónico y una notificación.",
  },
  "Impossible de contacter le client.": {
    en: "Unable to contact the client.",
    ar: "تعذّر التواصل مع العميل.",
    es: "No se pudo contactar al cliente.",
  },
  "Suspension amiable validée par le modérateur.": {
    en: "Amicable suspension approved by the moderator.",
    ar: "تمت الموافقة على التعليق الودي من قبل المشرف.",
    es: "Suspensión amistosa aprobada por el moderador.",
  },
  "Suspension amiable refusée par le modérateur.": {
    en: "Amicable suspension rejected by the moderator.",
    ar: "رفض المشرف التعليق الودي.",
    es: "Suspensión amistosa rechazada por el moderador.",
  },
  "Impossible d'enregistrer la décision.": {
    en: "Unable to save the decision.",
    ar: "تعذّر حفظ القرار.",
    es: "No se pudo guardar la decisión.",
  },
  "Justification de l'agence acceptée — le projet reprend son cours normal.": {
    en: "Agency's justification accepted — the project resumes as normal.",
    ar: "تم قبول تبرير الوكالة — يستأنف المشروع مساره الطبيعي.",
    es: "Justificación de la agencia aceptada — el proyecto continúa su curso normal.",
  },
  "Justification jugée insuffisante — le projet est rejeté (conséquences CDC §2.5.3 appliquées).": {
    en: "Justification deemed insufficient — the project is rejected (consequences per ToS §2.5.3 applied).",
    ar: "اعتُبر التبرير غير كافٍ — يُرفض المشروع (تطبيق أحكام شروط الخدمة §2.5.3).",
    es: "Justificación considerada insuficiente — el proyecto es rechazado (se aplican las consecuencias de las CDC §2.5.3).",
  },
  "Litiges & suspensions": {
    en: "Disputes & suspensions",
    ar: "النزاعات والتعليقات",
    es: "Disputas y suspensiones",
  },
  "File d'attente des dossiers en attente, tous projets/agences/clients confondus.": {
    en: "Queue of pending cases, across all projects, agencies and clients.",
    ar: "قائمة انتظار الملفات المعلقة، لجميع المشاريع والوكالات والعملاء.",
    es: "Cola de expedientes pendientes, de todos los proyectos, agencias y clientes.",
  },
  "Litiges en préavis — décision finale": {
    en: "Disputes under notice — final decision",
    ar: "نزاعات قيد الإشعار — القرار النهائي",
    es: "Disputas en preaviso — decisión final",
  },
  "Litiges client déjà jugés fondés : l'agence a été invitée à répondre avant conséquences finales (rejet du projet).": {
    en: "Client disputes already ruled upheld: the agency has been invited to respond before final consequences (project rejection).",
    ar: "نزاعات العملاء التي تم الحكم بتأسيسها بالفعل: تمت دعوة الوكالة للرد قبل تطبيق العواقب النهائية (رفض المشروع).",
    es: "Disputas de clientes ya consideradas fundadas: se ha invitado a la agencia a responder antes de las consecuencias finales (rechazo del proyecto).",
  },
  "Agence inconnue": {
    en: "Unknown agency",
    ar: "وكالة غير معروفة",
    es: "Agencia desconocida",
  },
  "Agence a répondu": {
    en: "Agency responded",
    ar: "ردّت الوكالة",
    es: "La agencia respondió",
  },
  "En attente —": {
    en: "Pending —",
    ar: "قيد الانتظار —",
    es: "Pendiente —",
  },
  "Justification client :": {
    en: "Client's justification:",
    ar: "تبرير العميل:",
    es: "Justificación del cliente:",
  },
  "Réponse de l'agence :": {
    en: "Agency's response:",
    ar: "رد الوكالة:",
    es: "Respuesta de la agencia:",
  },
  "L'agence n'a pas encore répondu.": {
    en: "The agency has not responded yet.",
    ar: "لم تردّ الوكالة بعد.",
    es: "La agencia aún no ha respondido.",
  },
  "Accepter — reprendre le projet": {
    en: "Accept — resume the project",
    ar: "قبول — استئناف المشروع",
    es: "Aceptar — reanudar el proyecto",
  },
  "Rejeter le projet": {
    en: "Reject the project",
    ar: "رفض المشروع",
    es: "Rechazar el proyecto",
  },
  "Rechercher par projet, client, agence...": {
    en: "Search by project, client, agency...",
    ar: "ابحث حسب المشروع أو العميل أو الوكالة...",
    es: "Buscar por proyecto, cliente, agencia...",
  },
  "Aucun dossier en attente dans cette vue.": {
    en: "No pending cases in this view.",
    ar: "لا توجد ملفات معلقة في هذا العرض.",
    es: "No hay expedientes pendientes en esta vista.",
  },
  "Litige": {
    en: "Dispute",
    ar: "نزاع",
    es: "Disputa",
  },
  "Suspension amiable": {
    en: "Amicable suspension",
    ar: "تعليق ودي",
    es: "Suspensión amistosa",
  },
  "Vérification auprès du client": {
    en: "Verification with the client",
    ar: "التحقق لدى العميل",
    es: "Verificación con el cliente",
  },
  "Réponse du client :": {
    en: "Client's response:",
    ar: "رد العميل:",
    es: "Respuesta del cliente:",
  },
  "Client contacté le": {
    en: "Client contacted on",
    ar: "تم التواصل مع العميل في",
    es: "Cliente contactado el",
  },
  "— en attente de réponse.": {
    en: "— awaiting response.",
    ar: "— بانتظار الرد.",
    es: "— a la espera de respuesta.",
  },
  "Le client n'a pas encore été contacté au sujet de cette plainte.": {
    en: "The client has not yet been contacted about this complaint.",
    ar: "لم يتم التواصل مع العميل بعد بشأن هذه الشكوى.",
    es: "Aún no se ha contactado al cliente sobre esta reclamación.",
  },
  "Envoi...": {
    en: "Sending...",
    ar: "جارٍ الإرسال...",
    es: "Enviando...",
  },
  "Contacter le client": {
    en: "Contact the client",
    ar: "التواصل مع العميل",
    es: "Contactar al cliente",
  },
  "Litige fondé": {
    en: "Dispute upheld",
    ar: "نزاع مؤسَّس",
    es: "Disputa fundada",
  },
  "Litige non fondé": {
    en: "Dispute not upheld",
    ar: "نزاع غير مؤسَّس",
    es: "Disputa no fundada",
  },
  "En attente de la décision directe de l'agence. Le bouton ci-dessous est un filet de sécurité (agence injoignable/inactive) — pas le flux nominal.": {
    en: "Awaiting the agency's direct decision. The button below is a safety net (agency unreachable/inactive) — not the standard flow.",
    ar: "في انتظار القرار المباشر من الوكالة. الزر أدناه هو شبكة أمان (وكالة يتعذّر الوصول إليها/غير نشطة) — وليس المسار المعتاد.",
    es: "A la espera de la decisión directa de la agencia. El botón de abajo es una red de seguridad (agencia inalcanzable/inactiva) — no es el flujo habitual.",
  },
  "Forcer la validation": {
    en: "Force approval",
    ar: "فرض الموافقة",
    es: "Forzar la validación",
  },
  "Forcer le refus": {
    en: "Force rejection",
    ar: "فرض الرفض",
    es: "Forzar el rechazo",
  },
  "Confirmer : litige fondé": {
    en: "Confirm: dispute upheld",
    ar: "تأكيد: النزاع مؤسَّس",
    es: "Confirmar: disputa fundada",
  },
  "Confirmer : litige non fondé": {
    en: "Confirm: dispute not upheld",
    ar: "تأكيد: النزاع غير مؤسَّس",
    es: "Confirmar: disputa no fundada",
  },
  "Litige déposé par l'agence (client inactif) : le projet est rejeté immédiatement et la commission créditée à l'agence. Litige déposé par le client (agence défaillante) : le projet reste Suspendu, l'agence reçoit un délai de réponse avant décision finale (section « Litiges en préavis »).": {
    en: "Dispute filed by the agency (inactive client): the project is rejected immediately and the commission is credited to the agency. Dispute filed by the client (defaulting agency): the project remains Suspended, the agency receives a response deadline before a final decision (\"Disputes under notice\" section).",
    ar: "نزاع رفعته الوكالة (عميل غير نشط): يُرفض المشروع فورًا وتُقيَّد العمولة لصالح الوكالة. نزاع رفعه العميل (وكالة متخلفة): يبقى المشروع معلّقًا، وتحصل الوكالة على مهلة للرد قبل القرار النهائي (قسم \"النزاعات قيد الإشعار\").",
    es: "Disputa presentada por la agencia (cliente inactivo): el proyecto se rechaza de inmediato y la comisión se acredita a la agencia. Disputa presentada por el cliente (agencia incumplidora): el proyecto permanece Suspendido, la agencia recibe un plazo de respuesta antes de la decisión final (sección \"Disputas en preaviso\").",
  },
  "Le projet reprend son cours normal, comme un simple « Reprendre ».": {
    en: "The project resumes as normal, like a simple \"Resume\".",
    ar: "يستأنف المشروع مساره الطبيعي، تمامًا مثل عملية \"استئناف\" بسيطة.",
    es: "El proyecto continúa su curso normal, como un simple \"Reanudar\".",
  },
  "Confirmer le verdict": {
    en: "Confirm the verdict",
    ar: "تأكيد القرار",
    es: "Confirmar el veredicto",
  },
  "Note de décision (optionnel)": {
    en: "Decision note (optional)",
    ar: "ملاحظة القرار (اختياري)",
    es: "Nota de la decisión (opcional)",
  },
  "Motivation du verdict, visible dans l'historique du dossier...": {
    en: "Reasoning for the verdict, visible in the case history...",
    ar: "مبررات القرار، تظهر في سجل الملف...",
    es: "Motivación del veredicto, visible en el historial del expediente...",
  },
  "Confirmer : reprendre le projet": {
    en: "Confirm: resume the project",
    ar: "تأكيد: استئناف المشروع",
    es: "Confirmar: reanudar el proyecto",
  },
  "Confirmer : rejeter le projet": {
    en: "Confirm: reject the project",
    ar: "تأكيد: رفض المشروع",
    es: "Confirmar: rechazar el proyecto",
  },
  "Le projet repasse En cours, l'opportunité de l'agence repasse Gagnée.": {
    en: "The project goes back to In progress, the agency's opportunity goes back to Won.",
    ar: "يعود المشروع إلى حالة \"قيد التنفيذ\"، وتعود فرصة الوكالة إلى حالة \"مكسوبة\".",
    es: "El proyecto vuelve a En curso, la oportunidad de la agencia vuelve a Ganada.",
  },
  "Le projet passe Rejeté (sous-statut Agence défaillante), l'agence reçoit une pénalité PQI.": {
    en: "The project moves to Rejected (sub-status Defaulting agency), the agency receives a PQI penalty.",
    ar: "ينتقل المشروع إلى حالة \"مرفوض\" (الحالة الفرعية: وكالة متخلفة)، وتتلقى الوكالة عقوبة PQI.",
    es: "El proyecto pasa a Rechazado (subestado Agencia incumplidora), la agencia recibe una penalización PQI.",
  },
  "Confirmer": {
    en: "Confirm",
    ar: "تأكيد",
    es: "Confirmar",
  },
  "Motivation de la décision finale...": {
    en: "Reasoning for the final decision...",
    ar: "مبررات القرار النهائي...",
    es: "Motivación de la decisión final...",
  },
  "...": {
    en: "...",
    ar: "...",
    es: "...",
  },
} satisfies PageTextDict;

function AdminLitigesPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role && role !== "admin") {
      void navigate({
        to: role === "agency" ? "/agence/tableau-de-bord" : "/client/tableau-de-bord",
      });
    }
  }, [role, navigate]);

  const casesQuery = useQuery({
    queryKey: ["admin", "moderation", "pending"],
    queryFn: () => listPendingSuspensions(),
    enabled: role === "admin",
  });
  const allCases = useMemo(() => casesQuery.data ?? [], [casesQuery.data]);

  const noticesQuery = useQuery({
    queryKey: ["admin", "moderation", "litige-notices"],
    queryFn: () => listPendingLitigeNotices(),
    enabled: role === "admin",
  });
  const litigeNotices = useMemo(() => noticesQuery.data ?? [], [noticesQuery.data]);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dispute");

  const counts = useMemo(
    () => ({
      all: allCases.length,
      dispute: allCases.filter((item) => item.category === "dispute").length,
      amicable: allCases.filter((item) => item.category === "amicable").length,
    }),
    [allCases],
  );

  const filteredCases = useMemo(() => {
    let items = allCases;
    if (activeTab !== "all") {
      items = items.filter((item) => item.category === activeTab);
    }
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      items = items.filter((item) =>
        `${item.projectTitle} ${item.clientName} ${item.agencyName ?? ""} ${item.justification}`
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }
    return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [allCases, activeTab, query]);

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });

  const [verdictTarget, setVerdictTarget] = useState<ModerationCase | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [pendingFounded, setPendingFounded] = useState<boolean | null>(null);

  const resolveMutation = useMutation({
    mutationFn: ({ id, founded }: { id: string; founded: boolean }) =>
      resolveDispute(id, founded, decisionNote.trim() || undefined),
    onSuccess: (_data, variables) => {
      toast(
        variables.founded
          ? tt(
              "Litige tranché : fondé — pour un litige déposé par l'agence, le projet est rejeté immédiatement ; pour un litige déposé par le client, l'agence dispose désormais d'un délai de réponse avant décision finale (cf. section « Litiges en préavis »).",
            )
          : tt("Litige tranché : non fondé — le projet reprend son cours normal."),
      );
      invalidate();
      setVerdictTarget(null);
      setDecisionNote("");
      setPendingFounded(null);
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer le verdict."));
    },
  });

  const contactMutation = useMutation({
    mutationFn: (id: string) => contactDisputeClient(id),
    onSuccess: () => {
      toast(tt("Client contacté — un email et une notification lui ont été envoyés."));
      invalidate();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible de contacter le client."));
    },
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "refuse" }) =>
      decision === "approve" ? approveSuspensionAsModerator(id) : refuseSuspensionAsModerator(id),
    onSuccess: (_data, variables) => {
      toast(
        variables.decision === "approve"
          ? tt("Suspension amiable validée par le modérateur.")
          : tt("Suspension amiable refusée par le modérateur."),
      );
      invalidate();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer la décision."));
    },
  });

  const [noticeTarget, setNoticeTarget] = useState<LitigeNoticeCase | null>(null);
  const [noticeDecisionNote, setNoticeDecisionNote] = useState("");
  const [noticeAccept, setNoticeAccept] = useState<boolean | null>(null);

  const noticeMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      resolveLitigeNotice(id, accept, noticeDecisionNote.trim() || undefined),
    onSuccess: (_data, variables) => {
      toast(
        variables.accept
          ? tt("Justification de l'agence acceptée — le projet reprend son cours normal.")
          : tt(
              "Justification jugée insuffisante — le projet est rejeté (conséquences CDC §2.5.3 appliquées).",
            ),
      );
      invalidate();
      setNoticeTarget(null);
      setNoticeDecisionNote("");
      setNoticeAccept(null);
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer la décision."));
    },
  });

  if (role !== "admin") return null;

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">{tt("Litiges & suspensions")}</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          {tt("File d'attente des dossiers en attente, tous projets/agences/clients confondus.")}
        </p>

        {litigeNotices.length > 0 ? (
          <div className="mt-7">
            <SectionCard
              title={tt("Litiges en préavis — décision finale")}
              description={tt(
                "Litiges client déjà jugés fondés : l'agence a été invitée à répondre avant conséquences finales (rejet du projet).",
              )}
            >
              <div className="space-y-4">
                {litigeNotices.map((item) => (
                  <article key={item.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold">{item.projectTitle}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {item.clientName} — {item.agencyName ?? tt("Agence inconnue")}
                        </p>
                      </div>
                      <StatusBadge
                        label={
                          item.litigeNoticeStatus === "Responded"
                            ? tt("Agence a répondu")
                            : `${tt("En attente —")} ${describeNoticeDeadline(item.agencyNoticeDeadline, tt)}`
                        }
                      />
                    </div>

                    <p className="mt-3 text-[13px] text-muted-foreground">
                      <span className="font-semibold">{tt("Justification client :")} </span>
                      {item.justification}
                    </p>

                    {item.agencyResponse ? (
                      <p className="mt-2 rounded-md bg-accent/40 p-2.5 text-[13px]">
                        <span className="font-semibold">{tt("Réponse de l'agence :")} </span>
                        {item.agencyResponse}
                      </p>
                    ) : (
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        {tt("L'agence n'a pas encore répondu.")}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNoticeTarget(item);
                          setNoticeAccept(true);
                        }}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {tt("Accepter — reprendre le projet")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNoticeTarget(item);
                          setNoticeAccept(false);
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                      >
                        <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {tt("Rejeter le projet")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>
          </div>
        ) : null}

        <div className="mt-8">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={tt("Rechercher par projet, client, agence...")}
          />
        </div>

        <div className="mt-6">
          <StatusTabs
            tabs={TABS.map((tab) => ({ ...tab, label: tt(tab.label) }))}
            value={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />
        </div>

        <div className="mt-6">
          {casesQuery.isPending ? (
            <StackSkeleton count={4} />
          ) : filteredCases.length === 0 ? (
            <EmptyState message={tt("Aucun dossier en attente dans cette vue.")} />
          ) : (
            <div className="space-y-4">
              {filteredCases.map((item) => (
                <article key={item.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold">{item.projectTitle}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {item.clientName} — {item.agencyName ?? tt("Agence inconnue")}
                      </p>
                    </div>
                    <StatusBadge
                      label={item.category === "dispute" ? tt("Litige") : tt("Suspension amiable")}
                    />
                  </div>

                  {item.justification ? (
                    <p className="mt-3 text-[13px] text-muted-foreground">{item.justification}</p>
                  ) : null}

                  {item.category === "dispute" && item.requestedBy === "agency" ? (
                    <div className="mt-3 rounded-md border border-border bg-accent/30 p-3">
                      <p className="text-[12px] font-semibold text-muted-foreground">
                        {tt("Vérification auprès du client")}
                      </p>
                      {item.clientResponse ? (
                        <p className="mt-1.5 text-[13px]">
                          <span className="font-semibold">{tt("Réponse du client :")} </span>
                          {item.clientResponse}
                        </p>
                      ) : item.clientContactedDate ? (
                        <p className="mt-1.5 text-[13px] text-muted-foreground">
                          {tt("Client contacté le")}{" "}
                          {new Date(item.clientContactedDate).toLocaleString("fr-FR")}{" "}
                          {tt("— en attente de réponse.")}
                        </p>
                      ) : (
                        <div className="mt-1.5 flex items-center justify-between gap-3">
                          <p className="text-[13px] text-muted-foreground">
                            {tt("Le client n'a pas encore été contacté au sujet de cette plainte.")}
                          </p>
                          <button
                            type="button"
                            disabled={contactMutation.isPending}
                            onClick={() => contactMutation.mutate(item.id)}
                            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {contactMutation.isPending ? tt("Envoi...") : tt("Contacter le client")}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {item.category === "dispute" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVerdictTarget(item);
                          setPendingFounded(true);
                        }}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {tt("Litige fondé")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVerdictTarget(item);
                          setPendingFounded(false);
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                      >
                        <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {tt("Litige non fondé")}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-[13px] text-muted-foreground">
                        {tt(
                          "En attente de la décision directe de l'agence. Le bouton ci-dessous est un filet de sécurité (agence injoignable/inactive) — pas le flux nominal.",
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={overrideMutation.isPending}
                          onClick={() =>
                            overrideMutation.mutate({ id: item.id, decision: "approve" })
                          }
                          className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {tt("Forcer la validation")}
                        </button>
                        <button
                          type="button"
                          disabled={overrideMutation.isPending}
                          onClick={() =>
                            overrideMutation.mutate({ id: item.id, decision: "refuse" })
                          }
                          className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {tt("Forcer le refus")}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <ActionModal
        open={verdictTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setVerdictTarget(null);
            setDecisionNote("");
            setPendingFounded(null);
          }
        }}
        title={pendingFounded ? tt("Confirmer : litige fondé") : tt("Confirmer : litige non fondé")}
        description={
          pendingFounded
            ? tt(
                "Litige déposé par l'agence (client inactif) : le projet est rejeté immédiatement et la commission créditée à l'agence. Litige déposé par le client (agence défaillante) : le projet reste Suspendu, l'agence reçoit un délai de réponse avant décision finale (section « Litiges en préavis »).",
              )
            : tt("Le projet reprend son cours normal, comme un simple « Reprendre ».")
        }
        confirmLabel={resolveMutation.isPending ? tt("...") : tt("Confirmer le verdict")}
        onConfirm={() => {
          if (!verdictTarget || pendingFounded === null) return;
          resolveMutation.mutate({ id: verdictTarget.id, founded: pendingFounded });
        }}
      >
        <TextAreaField
          label={tt("Note de décision (optionnel)")}
          rows={4}
          value={decisionNote}
          onChange={(event) => setDecisionNote(event.target.value)}
          placeholder={tt("Motivation du verdict, visible dans l'historique du dossier...")}
        />
      </ActionModal>

      <ActionModal
        open={noticeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNoticeTarget(null);
            setNoticeDecisionNote("");
            setNoticeAccept(null);
          }
        }}
        title={
          noticeAccept ? tt("Confirmer : reprendre le projet") : tt("Confirmer : rejeter le projet")
        }
        description={
          noticeAccept
            ? tt("Le projet repasse En cours, l'opportunité de l'agence repasse Gagnée.")
            : tt(
                "Le projet passe Rejeté (sous-statut Agence défaillante), l'agence reçoit une pénalité PQI.",
              )
        }
        confirmLabel={noticeMutation.isPending ? tt("...") : tt("Confirmer")}
        onConfirm={() => {
          if (!noticeTarget || noticeAccept === null) return;
          noticeMutation.mutate({ id: noticeTarget.id, accept: noticeAccept });
        }}
      >
        <TextAreaField
          label={tt("Note de décision (optionnel)")}
          rows={4}
          value={noticeDecisionNote}
          onChange={(event) => setNoticeDecisionNote(event.target.value)}
          placeholder={tt("Motivation de la décision finale...")}
        />
      </ActionModal>
    </DashboardShell>
  );
}
