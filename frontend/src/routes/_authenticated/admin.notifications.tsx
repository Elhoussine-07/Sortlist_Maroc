import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronDown } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({
    meta: [{ title: "Historique des notifications — Administration" }],
  }),
  component: AdminNotificationsPage,
});

const TABS = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "read", label: "Lues" },
];

const PAGE_SIZE = 20;

const PAGE_TEXT = {
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
  "Impossible de marquer cette notification comme lue.": {
    en: "Unable to mark this notification as read.",
    ar: "تعذّر وضع علامة على هذا الإشعار كمقروء.",
    es: "No se pudo marcar esta notificación como leída.",
  },
  "Toutes les notifications ont été marquées comme lues": {
    en: "All notifications have been marked as read",
    ar: "تم وضع علامة على جميع الإشعارات كمقروءة",
    es: "Todas las notificaciones se marcaron como leídas",
  },
  "Impossible de marquer les notifications comme lues.": {
    en: "Unable to mark notifications as read.",
    ar: "تعذّر وضع علامة على الإشعارات كمقروءة.",
    es: "No se pudieron marcar las notificaciones como leídas.",
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
    ar: "وضع علامة كمقروءة",
    es: "Marcar como leída",
  },
  "Historique des notifications": {
    en: "Notification history",
    ar: "سجل الإشعارات",
    es: "Historial de notificaciones",
  },
  "Notifications reçues sur votre compte modérateur/administrateur.": {
    en: "Notifications received on your moderator/administrator account.",
    ar: "الإشعارات المستلمة على حساب المشرف/المسؤول الخاص بك.",
    es: "Notificaciones recibidas en tu cuenta de moderador/administrador.",
  },
  "Tout marquer comme lu": {
    en: "Mark all as read",
    ar: "وضع علامة على الكل كمقروء",
    es: "Marcar todo como leído",
  },
  "Rechercher une notification...": {
    en: "Search a notification...",
    ar: "البحث عن إشعار...",
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
    es: "Periodo",
  },
  "Toutes les périodes": {
    en: "All periods",
    ar: "جميع الفترات",
    es: "Todos los periodos",
  },
  "Tous les statuts": {
    en: "All statuses",
    ar: "جميع الحالات",
    es: "Todos los estados",
  },
  "{count} notifications": {
    en: "{count} notifications",
    ar: "{count} إشعار",
    es: "{count} notificaciones",
  },
  "Trier par : ": {
    en: "Sort by: ",
    ar: "ترتيب حسب: ",
    es: "Ordenar por: ",
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

function AdminNotificationsPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const setStoreNotifications = useNotificationsStore((state) => state.setNotifications);
  const setStoreUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
  const setStoreLoading = useNotificationsStore((state) => state.setLoading);

  const activeQuery = useQuery({
    queryKey: ["admin", "notifications", "active"],
    queryFn: () => getNotifications(),
  });
  const historyQuery = useQuery({
    queryKey: ["admin", "notifications", "history"],
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
    void queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => invalidateNotifications(),
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

  const COLUMNS: Column<Notification>[] = useMemo(
    () => [
      {
        key: "notification",
        header: tt("Notification"),
        width: "minmax(0,2.4fr)",
        render: (notification) => (
          <div className="flex min-w-0 items-start gap-3">
            <Bell className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{notification.title}</p>
              <p className="truncate text-[13px] text-muted-foreground">
                {notification.description}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: tt("Statut"),
        width: "minmax(0,1fr)",
        render: (notification) => (
          <StatusBadge label={notification.read ? tt("Lue") : tt("Non lue")} />
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
            <span className="text-[13px] text-muted-foreground">—</span>
          ) : (
            <button
              onClick={() => markReadMutation.mutate(notification.id)}
              type="button"
              disabled={markReadMutation.isPending}
              className="rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
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
    <DashboardShell role="admin">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold tracking-tight">
              {tt("Historique des notifications")}
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {tt("Notifications reçues sur votre compte modérateur/administrateur.")}
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
            {tt("{count} notifications").replace("{count}", String(total))}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {tt("Trier par : ")}
            {sortDirection === "recent" ? tt("Plus récentes") : tt("Plus anciennes")}
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
