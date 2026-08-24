import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { It as CheckCheck, Pt as ChevronDown, qt as Bell } from "../_libs/lucide-react.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { c as StatusTabs, r as SearchInput, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as markAsRead, i as markAllAsRead, n as getNotificationHistory, o as useNotificationsStore, r as getNotifications, t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as ListPagination, t as FilterSelect } from "./ListControls-FMqnx6XI.mjs";
import { t as DataTable } from "./DataTable-EspjDfBC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.notifications-mI4SXfDO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		value: "all",
		label: "Toutes"
	},
	{
		value: "unread",
		label: "Non lues"
	},
	{
		value: "read",
		label: "Lues"
	}
];
var PAGE_SIZE = 20;
function AdminNotificationsPage() {
	const queryClient = useQueryClient();
	const setStoreNotifications = useNotificationsStore((state) => state.setNotifications);
	const setStoreUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
	const setStoreLoading = useNotificationsStore((state) => state.setLoading);
	const activeQuery = useQuery({
		queryKey: [
			"admin",
			"notifications",
			"active"
		],
		queryFn: () => getNotifications()
	});
	const historyQuery = useQuery({
		queryKey: [
			"admin",
			"notifications",
			"history"
		],
		queryFn: () => getNotificationHistory({ pageSize: 200 })
	});
	const isLoading = activeQuery.isPending || historyQuery.isPending;
	const notifications = (0, import_react.useMemo)(() => {
		const active = activeQuery.data?.items ?? [];
		const history = historyQuery.data ?? [];
		return [...active, ...history];
	}, [activeQuery.data, historyQuery.data]);
	(0, import_react.useEffect)(() => {
		setStoreLoading(isLoading);
	}, [isLoading, setStoreLoading]);
	(0, import_react.useEffect)(() => {
		setStoreNotifications(notifications);
		setStoreUnreadCount(notifications.filter((item) => !item.read).length);
	}, [
		notifications,
		setStoreNotifications,
		setStoreUnreadCount
	]);
	const invalidateNotifications = () => {
		queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
		queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
	};
	const markReadMutation = useMutation({
		mutationFn: (id) => markAsRead(id),
		onSuccess: () => invalidateNotifications(),
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Impossible de marquer cette notification comme lue.");
		}
	});
	const markAllReadMutation = useMutation({
		mutationFn: () => markAllAsRead(),
		onSuccess: () => {
			invalidateNotifications();
			toast.success("Toutes les notifications ont été marquées comme lues");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Impossible de marquer les notifications comme lues.");
		}
	});
	const COLUMNS = (0, import_react.useMemo)(() => [
		{
			key: "notification",
			header: "Notification",
			width: "minmax(0,2.4fr)",
			render: (notification) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
					className: "mt-0.5 h-[18px] w-[18px] shrink-0",
					strokeWidth: 1.6
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[13.5px] font-bold",
						children: notification.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[13px] text-muted-foreground",
						children: notification.description
					})]
				})]
			})
		},
		{
			key: "status",
			header: "Statut",
			width: "minmax(0,1fr)",
			render: (notification) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: notification.read ? "Lue" : "Non lue" })
		},
		{
			key: "date",
			header: "Date",
			width: "minmax(0,1fr)",
			render: (notification) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] text-muted-foreground",
				children: notification.createdAt
			})
		},
		{
			key: "action",
			header: "Action",
			width: "minmax(0,1fr)",
			render: (notification) => notification.read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13px] text-muted-foreground",
				children: "—"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => markReadMutation.mutate(notification.id),
				type: "button",
				disabled: markReadMutation.isPending,
				className: "rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
				children: "Marquer comme lue"
			})
		}
	], [markReadMutation]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [sortDirection, setSortDirection] = (0, import_react.useState)("recent");
	const [page, setPage] = (0, import_react.useState)(1);
	const counts = (0, import_react.useMemo)(() => {
		const unread = notifications.filter((item) => !item.read).length;
		return {
			all: notifications.length,
			unread,
			read: notifications.length - unread
		};
	}, [notifications]);
	const filteredNotifications = (0, import_react.useMemo)(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return [...notifications.filter((notification) => {
			const matchesTab = activeTab === "all" || activeTab === "unread" && !notification.read || activeTab === "read" && notification.read;
			const matchesQuery = normalizedQuery.length === 0 || notification.title.toLowerCase().includes(normalizedQuery) || notification.description.toLowerCase().includes(normalizedQuery);
			return matchesTab && matchesQuery;
		})].sort((a, b) => sortDirection === "recent" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
	}, [
		notifications,
		activeTab,
		query,
		sortDirection
	]);
	const total = filteredNotifications.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const pagedNotifications = filteredNotifications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardShell, {
		role: "admin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[24px] font-bold tracking-tight",
							children: "Historique des notifications"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[14px] text-muted-foreground",
							children: "Notifications reçues sur votre compte modérateur/administrateur."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => markAllReadMutation.mutate(),
						type: "button",
						disabled: markAllReadMutation.isPending || counts["unread"] === 0,
						className: "flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 sm:justify-self-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
							className: "h-3.5 w-3.5",
							strokeWidth: 1.8
						}), "Tout marquer comme lu"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-7",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchInput, {
						value: query,
						onChange: setQuery,
						placeholder: "Rechercher une notification..."
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusTabs, {
						tabs: TABS,
						value: activeTab,
						onChange: (value) => {
							setActiveTab(value);
							setPage(1);
						},
						counts
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Type",
							placeholder: "Tous les types"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Période",
							placeholder: "Toutes les périodes"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Statut",
							placeholder: "Tous les statuts"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-[14px] font-semibold",
						children: [total, " notifications"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setSortDirection((current) => current === "recent" ? "old" : "recent"),
						type: "button",
						className: "flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground",
						children: [
							"Trier par : ",
							sortDirection === "recent" ? "Plus récentes" : "Plus anciennes",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								className: "h-3.5 w-3.5",
								strokeWidth: 1.8
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
						columns: COLUMNS,
						rows: pagedNotifications,
						isLoading
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPagination, {
					page: currentPage,
					totalPages,
					onPageChange: setPage
				})
			]
		})
	});
}
//#endregion
export { AdminNotificationsPage as component };
