import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { O as Send, Pt as ChevronDown, _t as Download, dt as FileText, it as Inbox, jt as CircleCheck, p as TriangleAlert, yt as CreditCard } from "../_libs/lucide-react.mjs";
import { n as create } from "../_libs/zustand.mjs";
import { a as frappeCall, i as fetchBlob, n as GATEWAY_URL, r as camelizeKeys, t as ApiError } from "./http-BM0VI1yy.mjs";
import { a as StatCard, c as StatusTabs, i as SectionCard, o as StatGrid, r as SearchInput, s as StatusBadge, t as FormSkeleton, u as TextField } from "./Blocks-CStVFDlw.mjs";
import { r as StatSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as ListPagination, t as FilterSelect } from "./ListControls-FMqnx6XI.mjs";
import { t as DataTable } from "./DataTable-EspjDfBC.mjs";
import { n as objectType, r as stringType, t as enumType } from "../_libs/zod.mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agence.facturation-DXPGkunQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_MAP = {
	paid: "paid",
	payée: "paid",
	payee: "paid",
	"en attente": "to_pay",
	pending: "to_pay",
	unpaid: "to_pay",
	overdue: "late",
	"en retard": "late",
	late: "late"
};
var STATUS_LABELS = {
	paid: "Payée",
	to_pay: "À payer",
	late: "En retard"
};
function mapInvoiceStatus(raw) {
	return STATUS_MAP[String(raw ?? "").trim().toLowerCase()] ?? "to_pay";
}
function mapInvoice(raw) {
	const data = camelizeKeys(raw);
	const status = mapInvoiceStatus(data["status"]);
	const id = String(data["id"] ?? data["name"] ?? "");
	return {
		id,
		projectTitle: String(data["projectTitle"] ?? data["project"] ?? ""),
		companyName: String(data["companyName"] ?? data["agency"] ?? ""),
		amount: Number(data["amount"] ?? data["total"] ?? 0),
		issuedAt: String(data["issueDate"] ?? data["issuedAt"] ?? ""),
		dueAt: String(data["dueDate"] ?? data["dueAt"] ?? ""),
		status,
		statusLabel: String(data["statusLabel"] ?? STATUS_LABELS[status]),
		downloadUrl: String(data["downloadUrl"] ?? `http://localhost:8080/api/method/platform_core.platform_core.api.payment.download_invoice_pdf?name=${encodeURIComponent(id)}`),
		agency: data["agency"] ?? void 0,
		project: data["project"] ?? void 0,
		proposal: data["proposal"] ?? void 0,
		tax: data["tax"] !== void 0 ? Number(data["tax"]) : void 0,
		total: data["total"] !== void 0 ? Number(data["total"]) : void 0,
		commissionRate: data["commissionRate"] !== void 0 ? Number(data["commissionRate"]) : void 0,
		commissionAmount: data["commissionAmount"] !== void 0 ? Number(data["commissionAmount"]) : void 0,
		amountDue: data["amountDue"] !== void 0 ? Number(data["amountDue"]) : void 0,
		paymentDate: data["paymentDate"] ?? void 0,
		invoiceNumber: data["invoiceNumber"] ?? void 0
	};
}
async function getInvoices(filters) {
	const page = filters.page ?? 1;
	const pageSize = filters.pageSize ?? 20;
	const raw = await frappeCall("payment.list_invoices", { status: filters.status && filters.status !== "all" ? filters.status : void 0 });
	const items = (Array.isArray(raw) ? raw : []).map((item) => mapInvoice(item));
	return {
		items,
		page,
		pageSize,
		total: items.length,
		totalPages: 1
	};
}
async function getInvoicesSummary() {
	const raw = await frappeCall("payment.list_invoices", {});
	return (Array.isArray(raw) ? raw : []).map((item) => mapInvoice(item)).reduce((summary, invoice) => {
		if (invoice.status === "paid") summary.totalPaid += invoice.amount;
		else summary.pendingAmount += invoice.amount;
		return summary;
	}, {
		totalPaid: 0,
		pendingAmount: 0
	});
}
async function downloadInvoice(id) {
	const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.payment.download_invoice_pdf?name=${encodeURIComponent(id)}`;
	return fetchBlob(url);
}
function mapPaymentMethod(raw) {
	const data = camelizeKeys(raw);
	return {
		id: String(data["id"] ?? data["name"] ?? ""),
		methodType: data["methodType"] === "Bank Transfer" ? "Bank Transfer" : "Card",
		label: String(data["label"] ?? ""),
		isDefault: Boolean(data["isDefault"]),
		autoDebitEnabled: Boolean(data["autoDebitEnabled"])
	};
}
async function getPaymentMethods() {
	const raw = await frappeCall("payment.list_payment_methods", {});
	return (Array.isArray(raw) ? raw : []).map((item) => mapPaymentMethod(item));
}
async function registerPaymentMethod(payload) {
	const raw = await frappeCall("payment.register_payment_method", {
		method_type: payload.methodType,
		provider_token: payload.providerToken,
		label: payload.label,
		is_default: 1,
		auto_debit_enabled: 1
	});
	const data = camelizeKeys(raw);
	return { id: String(data["name"] ?? "") };
}
var useInvoicesStore = create((set) => ({
	invoices: [],
	totalPaid: null,
	pendingAmount: null,
	isLoading: false,
	error: null,
	setInvoices: (invoices) => set({ invoices }),
	setSummary: ({ totalPaid, pendingAmount }) => set({
		totalPaid,
		pendingAmount
	}),
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),
	reset: () => set({
		invoices: [],
		totalPaid: null,
		pendingAmount: null,
		error: null
	})
}));
var TABS = [
	{
		value: "issued",
		label: "Émises"
	},
	{
		value: "received",
		label: "Reçues"
	},
	{
		value: "paid",
		label: "Payées"
	},
	{
		value: "late",
		label: "En retard"
	}
];
function formatAmount(amount) {
	if (amount === null) return "—";
	return `${amount.toLocaleString("fr-FR")} €`;
}
function buildColumns(onDownload, downloadingId) {
	return [
		{
			key: "invoice",
			header: "Facture",
			width: "minmax(0,2.2fr)",
			render: (invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground/70",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
						className: "h-[16px] w-[16px]",
						strokeWidth: 1.7
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[13.5px] font-bold",
						children: invoice.projectTitle
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[12.5px] text-muted-foreground",
						children: invoice.companyName
					})]
				})]
			})
		},
		{
			key: "amount",
			header: "Montant",
			render: (invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] font-semibold",
				children: formatAmount(invoice.amount)
			})
		},
		{
			key: "issuedAt",
			header: "Émise le",
			render: (invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] text-muted-foreground",
				children: invoice.issuedAt
			})
		},
		{
			key: "dueAt",
			header: "Échéance",
			render: (invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] " + (invoice.status === "late" ? "font-semibold text-destructive" : "text-muted-foreground"),
				children: invoice.dueAt
			})
		},
		{
			key: "status",
			header: "Statut",
			render: (invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: invoice.statusLabel })
		},
		{
			key: "action",
			header: "Action",
			render: (invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onDownload(invoice),
				disabled: downloadingId === invoice.id,
				className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:opacity-60",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
					className: "h-3 w-3",
					strokeWidth: 1.8
				}), downloadingId === invoice.id ? "Téléchargement..." : "Télécharger"]
			})
		}
	];
}
function filterByTab(invoices, tab) {
	if (tab === "paid") return invoices.filter((invoice) => invoice.status === "paid");
	if (tab === "late") return invoices.filter((invoice) => invoice.status === "late");
	return invoices;
}
var paymentMethodSchema = objectType({
	methodType: enumType(["Card", "Bank Transfer"]),
	label: stringType().trim().min(1, "Champ requis").max(80),
	providerToken: stringType().trim().min(1, "Champ requis").max(80)
});
function PaymentMethodSection() {
	const queryClient = useQueryClient();
	const methodsQuery = useQuery({
		queryKey: ["agency", "payment-methods"],
		queryFn: getPaymentMethods
	});
	const defaultMethod = (methodsQuery.data ?? []).find((method) => method.isDefault) ?? null;
	const form = useForm({
		resolver: u(paymentMethodSchema),
		defaultValues: {
			methodType: "Card",
			label: "",
			providerToken: ""
		}
	});
	const registerMutation = useMutation({
		mutationFn: registerPaymentMethod,
		onSuccess: () => {
			toast.success("Moyen de paiement enregistré comme méthode par défaut.");
			form.reset({
				methodType: "Card",
				label: "",
				providerToken: ""
			});
			queryClient.invalidateQueries({ queryKey: ["agency", "payment-methods"] });
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Impossible d'enregistrer ce moyen de paiement.");
		}
	});
	const onSubmit = form.handleSubmit((values) => {
		registerMutation.mutate(values);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
		title: "Moyen de paiement",
		description: "Utilisé pour prélever automatiquement la commission de la plateforme dès qu'un client accepte un devis — aucune facture à régler manuellement tant qu'un moyen par défaut est configuré.",
		children: methodsQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSkeleton, { fields: 2 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [defaultMethod ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 rounded-md border border-border p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, {
						className: "h-4 w-4",
						strokeWidth: 1.8
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[13.5px] font-semibold",
						children: defaultMethod.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[12.5px] text-muted-foreground",
						children: [defaultMethod.methodType === "Card" ? "Carte bancaire" : "Virement bancaire", " — méthode par défaut"]
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-[13.5px] text-amber-700",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "mt-0.5 h-4 w-4 shrink-0",
					strokeWidth: 1.8
				}), "Aucun moyen de paiement enregistré — la commission restera en attente de règlement manuel tant qu'aucun n'est configuré ci-dessous."]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "grid grid-cols-1 gap-5 sm:grid-cols-3",
				noValidate: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[13px] text-muted-foreground",
							children: "Type"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							...form.register("methodType"),
							className: "mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[14px] outline-none focus:border-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Card",
								children: "Carte bancaire"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Bank Transfer",
								children: "Virement bancaire (IBAN)"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
						label: "Libellé",
						placeholder: "Visa ...1234 / IBAN FR76...",
						error: form.formState.errors.label?.message,
						...form.register("label")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
						label: "Numéro / IBAN",
						placeholder: "4242 4242 4242 4242",
						error: form.formState.errors.providerToken?.message,
						...form.register("providerToken")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:col-span-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: registerMutation.isPending,
							className: "rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
							children: registerMutation.isPending ? "Enregistrement..." : "Enregistrer comme méthode par défaut"
						})
					})
				]
			})]
		})
	});
}
function AgencyInvoicingPage() {
	const [page] = (0, import_react.useState)(1);
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("issued");
	const [downloadingId, setDownloadingId] = (0, import_react.useState)(null);
	const [sortDirection, setSortDirection] = (0, import_react.useState)("recent");
	const storeInvoices = useInvoicesStore((state) => state.invoices);
	const setStoreInvoices = useInvoicesStore((state) => state.setInvoices);
	const setStoreSummary = useInvoicesStore((state) => state.setSummary);
	const setStoreLoading = useInvoicesStore((state) => state.setLoading);
	const totalPaidStore = useInvoicesStore((state) => state.totalPaid);
	const invoicesQuery = useQuery({
		queryKey: [
			"agency",
			"invoices",
			"all"
		],
		queryFn: () => getInvoices({
			status: "all",
			page,
			pageSize: 100
		})
	});
	const summaryQuery = useQuery({
		queryKey: [
			"agency",
			"invoices",
			"summary"
		],
		queryFn: getInvoicesSummary
	});
	(0, import_react.useEffect)(() => {
		setStoreLoading(invoicesQuery.isLoading);
		if (invoicesQuery.data) setStoreInvoices(invoicesQuery.data.items);
	}, [invoicesQuery.data, invoicesQuery.isLoading]);
	(0, import_react.useEffect)(() => {
		if (summaryQuery.data) setStoreSummary(summaryQuery.data);
	}, [summaryQuery.data]);
	const isLoading = invoicesQuery.isLoading;
	const isSummaryLoading = summaryQuery.isLoading;
	const tabFiltered = filterByTab(storeInvoices, activeTab);
	const invoices = [...query.trim() ? tabFiltered.filter((invoice) => `${invoice.projectTitle} ${invoice.companyName}`.toLowerCase().includes(query.trim().toLowerCase())) : tabFiltered].sort((a, b) => sortDirection === "recent" ? b.issuedAt.localeCompare(a.issuedAt) : a.issuedAt.localeCompare(b.issuedAt));
	const counts = {
		issued: storeInvoices.length,
		received: storeInvoices.length,
		paid: storeInvoices.filter((invoice) => invoice.status === "paid").length,
		late: storeInvoices.filter((invoice) => invoice.status === "late").length
	};
	const totalLate = storeInvoices.filter((invoice) => invoice.status === "late").reduce((sum, invoice) => sum + invoice.amount, 0);
	const totalIssued = storeInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
	const summary = {
		totalIssued,
		totalReceived: totalIssued,
		totalPaid: totalPaidStore,
		totalLate
	};
	async function handleDownload(invoice) {
		setDownloadingId(invoice.id);
		try {
			const blob = await downloadInvoice(invoice.id);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = invoice.invoiceNumber ?? invoice.id;
			link.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Téléchargement impossible.");
		} finally {
			setDownloadingId(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "agency",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-[24px] font-bold tracking-tight",
					children: "Facturation"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[14px] text-muted-foreground",
					children: "Suivez vos paiements et téléchargez vos factures."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-7",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentMethodSection, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-7",
					children: isSummaryLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatSkeleton, { count: 4 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StatGrid, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							icon: Send,
							label: "Total émis",
							value: summary.totalIssued === null ? "—" : formatAmount(summary.totalIssued)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							icon: Inbox,
							label: "Total reçu",
							value: summary.totalReceived === null ? "—" : formatAmount(summary.totalReceived)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							icon: CircleCheck,
							label: "Total payé",
							value: summary.totalPaid === null ? "—" : formatAmount(summary.totalPaid)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							icon: TriangleAlert,
							label: "En retard",
							value: summary.totalLate === null ? "—" : formatAmount(summary.totalLate)
						})
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-7",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchInput, {
						value: query,
						onChange: setQuery,
						placeholder: "Rechercher une facture..."
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusTabs, {
						tabs: TABS,
						value: activeTab,
						onChange: setActiveTab,
						counts
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Statut",
							placeholder: "Tous les statuts"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Période",
							placeholder: "Toutes les périodes"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Client",
							placeholder: "Tous les clients"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-[14px] font-semibold",
						children: [counts[activeTab] ?? 0, " factures"]
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
						columns: buildColumns(handleDownload, downloadingId),
						rows: invoices,
						isLoading
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPagination, {
					page,
					totalPages: 1
				})
			]
		})]
	});
}
//#endregion
export { AgencyInvoicingPage as component };
