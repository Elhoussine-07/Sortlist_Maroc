import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, StatusTabs, StatusBadge } from "@/components/common/Blocks";
import { ListPagination } from "@/components/common/ListControls";
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

export const Route = createFileRoute("/_authenticated/client/notifications")({
  head: () => ({
    meta: [
      { title: "Historique des notifications — Sortlist" },
      {
        name: "description",
        content:
          "Consultez l'historique complet de vos notifications, filtrez par type et par statut.",
      },
      {
        property: "og:title",
        content: "Historique des notifications — Sortlist",
      },
      {
        property: "og:description",
        content: "Centre de notifications de votre espace client.",
      },
    ],
  }),
  component: ClientNotificationsPage,
});

const TABS = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "read", label: "Lues" },
];

const AGENCY_INTEREST_CATEGORY = "Prospection";

const TYPE_FILTERS: { value: string; label: string; categories: string[] }[] = [
  { value: "devis", label: "Devis", categories: ["Proposal", "Relance devis"] },
  { value: "facture", label: "Facture", categories: [] },

  {
    value: "projet",
    label: "Projet",
    categories: ["Project", "Opportunity", "Nouvelle opportunité", "Statut projet"],
  },

  {
    value: "suspension",
    label: "Suspension",
    categories: ["Suspension", "Suspension amiable", "Litige"],
  },

  {
    value: "agence-interessee",
    label: "Agences intéressées",
    categories: [AGENCY_INTEREST_CATEGORY],
  },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récentes" },
  { value: "old", label: "Plus anciennes" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 20;

function isWithinCurrentMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function isWithinCurrentYear(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === new Date().getFullYear();
}

function ClientNotificationsPage() {
  const queryClient = useQueryClient();
  const setStoreNotifications = useNotificationsStore((state) => state.setNotifications);
  const setStoreUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
  const setStoreLoading = useNotificationsStore((state) => state.setLoading);

  const activeQuery = useQuery({
    queryKey: ["client", "notifications", "active"],
    queryFn: () => getNotifications(),
  });
  const historyQuery = useQuery({
    queryKey: ["client", "notifications", "history"],
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
    void queryClient.invalidateQueries({ queryKey: ["client", "notifications"] });
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
          : "Impossible de marquer cette notification comme lue.",
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      invalidateNotifications();
      toast.success("Toutes les notifications ont été marquées comme lues");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Impossible de marquer les notifications comme lues.",
      );
    },
  });

  const COLUMNS: Column<Notification>[] = useMemo(
    () => [
      {
        key: "notification",
        header: "Notification",
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
        header: "Statut",
        width: "minmax(0,1fr)",
        render: (notification) => <StatusBadge label={notification.read ? "Lue" : "Non lue"} />,
      },
      {
        key: "date",
        header: "Date",
        width: "minmax(0,1fr)",
        render: (notification) => (
          <p className="truncate text-[13px] text-muted-foreground">{notification.createdAt}</p>
        ),
      },
      {
        key: "action",
        header: "Action",
        width: "minmax(0,1.6fr)",
        render: (notification) => {
          const showViewProfile =
            notification.category === AGENCY_INTEREST_CATEGORY && Boolean(notification.link);
          return (
            <div className="flex flex-wrap items-center gap-2">
              {showViewProfile ? (
                <a
                  href={notification.link ?? undefined}
                  onClick={() => {
                    if (!notification.read) markReadMutation.mutate(notification.id);
                  }}
                  className="rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                >
                  Voir le profil
                </a>
              ) : null}
              {notification.read ? null : (
                <button
                  onClick={() => markReadMutation.mutate(notification.id)}
                  type="button"
                  disabled={markReadMutation.isPending}
                  className="rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Marquer comme lue
                </button>
              )}
              {notification.read && !showViewProfile ? (
                <span className="text-[13px] text-muted-foreground">—</span>
              ) : null}
            </div>
          );
        },
      },
    ],
    [markReadMutation],
  );

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sortValue, setSortValue] = useState<SortValue>("recent");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const unread = notifications.filter((item) => !item.read).length;
    return {
      all: notifications.length,
      unread,
      read: notifications.length - unread,
    };
  }, [notifications]);

  const selectedTypeCategories = TYPE_FILTERS.find((item) => item.value === typeFilter)?.categories;

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let items = notifications.filter((notification) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "unread" && !notification.read) ||
        (activeTab === "read" && notification.read);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        notification.title.toLowerCase().includes(normalizedQuery) ||
        notification.description.toLowerCase().includes(normalizedQuery);

      const matchesType =
        !typeFilter ||
        (notification.category
          ? (selectedTypeCategories ?? []).includes(notification.category)
          : false);
      return matchesTab && matchesQuery && matchesType;
    });

    if (sortValue === "month") {
      items = items.filter((item) => isWithinCurrentMonth(item.createdAt));
    } else if (sortValue === "year") {
      items = items.filter((item) => isWithinCurrentYear(item.createdAt));
    }

    return [...items].sort((a, b) =>
      sortValue === "old"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  }, [notifications, activeTab, query, selectedTypeCategories, sortValue]);

  const total = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedNotifications = filteredNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortValue)?.label ?? "";

  return (
    <DashboardShell role="client">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold tracking-tight">Historique des notifications</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Retrouvez toutes les notifications reçues sur votre compte.
            </p>
          </div>
          <button
            onClick={() => markAllReadMutation.mutate()}
            type="button"
            disabled={markAllReadMutation.isPending || counts["unread"] === 0}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 sm:justify-self-end"
          >
            <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
            Tout marquer comme lu
          </button>
        </div>

        <div className="mt-7">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une notification..."
          />
        </div>

        <div className="mt-6">
          <StatusTabs
            tabs={TABS}
            value={activeTab}
            onChange={(value) => {
              setActiveTab(value);
              setPage(1);
            }}
            counts={counts}
          />
        </div>

        <div className="mt-6 max-w-[280px]">
          <label className="mb-1.5 block text-[13.5px] font-semibold">Type</label>
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary"
          >
            <option value="">Tous les types</option>
            {TYPE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">{total} notifications</p>
          <div className="relative">
            <button
              onClick={() => setIsSortOpen((open) => !open)}
              type="button"
              className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Trier par : {currentSortLabel}
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
            {isSortOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSortOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-md border border-border bg-background shadow-lg">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortValue(option.value);
                        setIsSortOpen(false);
                        setPage(1);
                      }}
                      className={
                        "block w-full px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-accent " +
                        (option.value === sortValue ? "font-semibold" : "")
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <DataTable columns={COLUMNS} rows={pagedNotifications} isLoading={isLoading} />
        </div>

        <ListPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardShell>
  );
}
