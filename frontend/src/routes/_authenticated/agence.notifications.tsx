import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronDown, Circle, CircleCheck, Eye, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, StatusTabs, StatusBadge } from "@/components/common/Blocks";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { useNotificationsStore } from "@/store/notifications.store";
import type { Notification } from "@/lib/types";
import {
  getNotificationHistory,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "@/services/notifications.service";
import { ApiError } from "@/services/http";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/_authenticated/agence/notifications")({
  head: () => ({
    meta: [
      { title: "Historique des notifications — Sortlist" },
      {
        name: "description",
        content:
          "Consultez l'historique complet des notifications de votre agence, filtrez par type et par statut.",
      },
      {
        property: "og:title",
        content: "Historique des notifications — Sortlist",
      },
      {
        property: "og:description",
        content: "Centre de notifications de votre espace agence.",
      },
    ],
  }),
  component: AgencyNotificationsPage,
});

const TABS = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "read", label: "Lues" },
];

const PAGE_SIZE = 20;

const PAGE_TEXT = {
  "Impossible de marquer cette notification comme lue.": {
    en: "Unable to mark this notification as read.",
    ar: "تعذّر وضع علامة \"مقروء\" على هذا الإشعار.",
    es: "No se pudo marcar esta notificación como leída.",
  },
  "Toutes les notifications ont été marquées comme lues": {
    en: "All notifications have been marked as read",
    ar: "تم وضع علامة \"مقروء\" على جميع الإشعارات",
    es: "Todas las notificaciones se marcaron como leídas",
  },
  "Impossible de marquer les notifications comme lues.": {
    en: "Unable to mark notifications as read.",
    ar: "تعذّر وضع علامة \"مقروء\" على الإشعارات.",
    es: "No se pudieron marcar las notificaciones como leídas.",
  },
  "Toutes": {
    en: "All",
    ar: "الكل",
    es: "Todas",
  },
  "Non lues": {
    en: "Unread",
    ar: "غير مقروءة",
    es: "No leídas",
  },
  "Lues": {
    en: "Read",
    ar: "مقروءة",
    es: "Leídas",
  },
  "Notification": {
    en: "Notification",
    ar: "الإشعار",
    es: "Notificación",
  },
  "Statut": {
    en: "Status",
    ar: "الحالة",
    es: "Estado",
  },
  "Date": {
    en: "Date",
    ar: "التاريخ",
    es: "Fecha",
  },
  "Action": {
    en: "Action",
    ar: "الإجراء",
    es: "Acción",
  },
  "Lue": {
    en: "Read",
    ar: "مقروءة",
    es: "Leída",
  },
  "Non lue": {
    en: "Unread",
    ar: "غير مقروءة",
    es: "No leída",
  },
  "Marquer comme lue": {
    en: "Mark as read",
    ar: "وضع علامة كمقروء",
    es: "Marcar como leída",
  },
  "Fermer": {
    en: "Close",
    ar: "إغلاق",
    es: "Cerrar",
  },
  "Voir le lien associé": {
    en: "View related link",
    ar: "عرض الرابط المرتبط",
    es: "Ver el enlace asociado",
  },
  "✅ Lue": {
    en: "✅ Read",
    ar: "✅ مقروءة",
    es: "✅ Leída",
  },
  "⏳ Non lue": {
    en: "⏳ Unread",
    ar: "⏳ غير مقروءة",
    es: "⏳ No leída",
  },
  "Historique des notifications": {
    en: "Notification history",
    ar: "سجل الإشعارات",
    es: "Historial de notificaciones",
  },
  "Retrouvez toutes les notifications reçues sur le compte de votre agence.": {
    en: "Find all the notifications received on your agency account.",
    ar: "اطّلع على جميع الإشعارات الواردة على حساب وكالتك.",
    es: "Encuentra todas las notificaciones recibidas en la cuenta de tu agencia.",
  },
  "Tout marquer comme lu": {
    en: "Mark all as read",
    ar: "وضع علامة على الكل كمقروء",
    es: "Marcar todo como leído",
  },
  "Rechercher une notification...": {
    en: "Search for a notification...",
    ar: "ابحث عن إشعار...",
    es: "Buscar una notificación...",
  },
  "Type": {
    en: "Type",
    ar: "النوع",
    es: "Tipo",
  },
  "Tous les types": {
    en: "All types",
    ar: "جميع الأنواع",
    es: "Todos los tipos",
  },
  "Période": {
    en: "Period",
    ar: "الفترة",
    es: "Período",
  },
  "Toutes les périodes": {
    en: "All periods",
    ar: "جميع الفترات",
    es: "Todos los períodos",
  },
  "Tous les statuts": {
    en: "All statuses",
    ar: "جميع الحالات",
    es: "Todos los estados",
  },
  "notifications": {
    en: "notifications",
    ar: "إشعارات",
    es: "notificaciones",
  },
  "Trier par :": {
    en: "Sort by:",
    ar: "ترتيب حسب:",
    es: "Ordenar por:",
  },
  "Plus récentes": {
    en: "Most recent",
    ar: "الأحدث",
    es: "Más recientes",
  },
  "Plus anciennes": {
    en: "Oldest",
    ar: "الأقدم",
    es: "Más antiguas",
  },
} satisfies PageTextDict;

function AgencyNotificationsPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const setStoreNotifications = useNotificationsStore((state) => state.setNotifications);
  const setStoreUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
  const setStoreLoading = useNotificationsStore((state) => state.setLoading);

  const activeQuery = useQuery({
    queryKey: ["agency", "notifications", "active"],
    queryFn: () => getNotifications(),
  });
  const historyQuery = useQuery({
    queryKey: ["agency", "notifications", "history"],
    queryFn: () => getNotificationHistory({ pageSize: 200 }),
  });
  const isLoading = activeQuery.isPending || historyQuery.isPending;

  const notifications = useMemo<Notification[]>(() => {
    const active = activeQuery.data?.items ?? [];
    const history = historyQuery.data ?? [];
    return [...active, ...history];
  }, [activeQuery.data, historyQuery.data]);

  useEffect(() => {
    setStoreLoading(isLoading);
  }, [isLoading, setStoreLoading]);

  useEffect(() => {
    setStoreNotifications(notifications);
    setStoreUnreadCount(notifications.filter((item) => !item.read).length);
  }, [notifications, setStoreNotifications, setStoreUnreadCount]);

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: ["agency", "notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      invalidateNotifications();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : tt("Impossible de marquer cette notification comme lue."),
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      invalidateNotifications();
      toast.success(tt("Toutes les notifications ont été marquées comme lues"));
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : tt("Impossible de marquer les notifications comme lues."),
      );
    },
  });

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
  };

  const COLUMNS: Column<Notification>[] = useMemo(
    () => [
      {
        key: "notification",
        header: tt("Notification"),
        width: "minmax(0,2.4fr)",
        render: (notification) => (
          <div
            className="flex min-w-0 items-start gap-3 cursor-pointer group hover:bg-accent/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="mt-0.5 shrink-0">
              {notification.read ? (
                <CircleCheck
                  className="h-[18px] w-[18px] text-muted-foreground/40"
                  strokeWidth={1.6}
                />
              ) : (
                <Circle
                  className="h-[18px] w-[18px] text-blue-500 fill-blue-500"
                  strokeWidth={1.6}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-[13.5px] ${notification.read ? "font-medium text-muted-foreground" : "font-bold"}`}
              >
                {notification.title}
              </p>
              <p
                className={`truncate text-[13px] ${notification.read ? "text-muted-foreground/70" : "text-muted-foreground"}`}
              >
                {notification.description}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/50 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {notification.createdAt}
              </p>
            </div>
            <div className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="h-4 w-4 text-muted-foreground/40" strokeWidth={1.4} />
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: tt("Statut"),
        width: "minmax(0,1fr)",
        render: (notification) => (
          <StatusBadge
            label={notification.read ? tt("Lue") : tt("Non lue")}
            variant={notification.read ? "success" : "warning"}
          />
        ),
      },
      {
        key: "date",
        header: tt("Date"),
        width: "minmax(0,1fr)",
        render: (notification) => (
          <p className="truncate text-[13px] text-muted-foreground">{notification.createdAt}</p>
        ),
      },
      {
        key: "action",
        header: tt("Action"),
        width: "minmax(0,1fr)",
        render: (notification) =>
          notification.read ? (
            <span className="text-[13px] text-muted-foreground/50">—</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markReadMutation.mutate(notification.id);
              }}
              type="button"
              disabled={markReadMutation.isPending}
              className="rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tt("Marquer comme lue")}
            </button>
          ),
      },
    ],
    [markReadMutation, tt],
  );

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const unread = notifications.filter((item) => !item.read).length;
    return {
      all: notifications.length,
      unread,
      read: notifications.length - unread,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = notifications.filter((notification) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "unread" && !notification.read) ||
        (activeTab === "read" && notification.read);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        notification.title.toLowerCase().includes(normalizedQuery) ||
        notification.description.toLowerCase().includes(normalizedQuery);
      return matchesTab && matchesQuery;
    });
    return [...items].sort((a, b) =>
      sortDirection === "recent"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  }, [notifications, activeTab, query, sortDirection]);

  const total = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedNotifications = filteredNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <DashboardShell role="agency">
      <div className="mx-auto max-w-[1080px]">
        {/* Modal de détails */}
        {isModalOpen && selectedNotification && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-in slide-in-from-bottom-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${selectedNotification.read ? "bg-muted" : "bg-blue-50"}`}
                  >
                    <Bell
                      className={`h-5 w-5 ${selectedNotification.read ? "text-muted-foreground" : "text-blue-500"}`}
                      strokeWidth={1.6}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedNotification.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {selectedNotification.createdAt}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-accent rounded-md transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.description}
                </p>
                {selectedNotification.category && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {selectedNotification.category}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        selectedNotification.read
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {selectedNotification.read ? tt("✅ Lue") : tt("⏳ Non lue")}
                    </span>
                  </div>
                )}
                {selectedNotification.link && (
                  <div className="mt-4">
                    <a
                      href={selectedNotification.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      {tt("Voir le lien associé")}
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-6 border-t border-border pt-4 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  {tt("Fermer")}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold tracking-tight">
              {tt("Historique des notifications")}
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {tt("Retrouvez toutes les notifications reçues sur le compte de votre agence.")}
            </p>
          </div>
          <button
            onClick={() => markAllReadMutation.mutate()}
            type="button"
            disabled={markAllReadMutation.isPending || counts["unread"] === 0}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 sm:justify-self-end"
          >
            <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
            {tt("Tout marquer comme lu")}
          </button>
        </div>

        <div className="mt-7">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={tt("Rechercher une notification...")}
          />
        </div>

        <div className="mt-6">
          <StatusTabs
            tabs={TABS.map((tab) => ({ ...tab, label: tt(tab.label) }))}
            value={activeTab}
            onChange={(value) => {
              setActiveTab(value);
              setPage(1);
            }}
            counts={counts}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FilterSelect label={tt("Type")} placeholder={tt("Tous les types")} />
          <FilterSelect label={tt("Période")} placeholder={tt("Toutes les périodes")} />
          <FilterSelect label={tt("Statut")} placeholder={tt("Tous les statuts")} />
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total} {tt("notifications")}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {tt("Trier par :")} {sortDirection === "recent" ? tt("Plus récentes") : tt("Plus anciennes")}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-4">
          <DataTable columns={COLUMNS} rows={pagedNotifications} isLoading={isLoading} />
        </div>

        <ListPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardShell>
  );
}
