import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Users } from "../_libs/lucide-react.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { _ as rejectJoinRequest, g as myJoinRequests, h as listJoinRequests, n as approveJoinRequest, t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { i as SectionCard, l as TextAreaField, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { t as DataTable } from "./DataTable-EspjDfBC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agence.invitations-7O5Gy6zc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SENT_STATUS_LABEL = {
	Pending: "En attente",
	Approved: "Acceptée",
	Rejected: "Refusée"
};
function receivedColumns(onAccept, onReject, pendingId) {
	return [
		{
			key: "user",
			header: "Utilisateur",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13.5px] font-bold",
				children: item.user
			})
		},
		{
			key: "context",
			header: "Contexte",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] text-muted-foreground",
				children: item.context
			})
		},
		{
			key: "requestedAt",
			header: "Demandé le",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] text-muted-foreground",
				children: item.requestedAt
			})
		},
		{
			key: "action",
			header: "Action",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: pendingId === item.id,
					onClick: () => onAccept(item),
					className: "rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50",
					children: "Accepter"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: pendingId === item.id,
					onClick: () => onReject(item),
					className: "rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:opacity-50",
					children: "Refuser"
				})]
			})
		}
	];
}
var sentColumns = [
	{
		key: "agencyName",
		header: "Agence",
		render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "truncate text-[13.5px] font-bold",
			children: item.agencyName
		})
	},
	{
		key: "status",
		header: "Statut",
		render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: SENT_STATUS_LABEL[item.status] })
	},
	{
		key: "requestedAt",
		header: "Demandé le",
		render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "truncate text-[13px] text-muted-foreground",
			children: item.requestedAt
		})
	},
	{
		key: "note",
		header: "Réponse",
		render: (item) => item.status === "Rejected" && item.rejectionReason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "truncate text-[13px] text-muted-foreground",
			children: item.rejectionReason
		}) : item.status === "Approved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "truncate text-[13px] text-muted-foreground",
			children: "Votre invitation est acceptée, vous avez accès pour gérer cette agence."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "truncate text-[13px] text-muted-foreground",
			children: "—"
		})
	}
];
function AgencyInvitationsPage() {
	const queryClient = useQueryClient();
	const [rejectTarget, setRejectTarget] = (0, import_react.useState)(null);
	const [rejectReason, setRejectReason] = (0, import_react.useState)("");
	const receivedQuery = useQuery({
		queryKey: [
			"agency",
			"join-requests",
			"received"
		],
		queryFn: listJoinRequests
	});
	const received = receivedQuery.data ?? [];
	const sentQuery = useQuery({
		queryKey: [
			"agency",
			"join-requests",
			"sent"
		],
		queryFn: myJoinRequests
	});
	const sent = sentQuery.data ?? [];
	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: ["agency", "join-requests"] });
	};
	const approveMutation = useMutation({
		mutationFn: (item) => approveJoinRequest(item.id),
		onSuccess: () => {
			toast("Demande acceptée");
			invalidateAll();
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'accepter cette demande.");
		}
	});
	const rejectMutation = useMutation({
		mutationFn: (payload) => rejectJoinRequest(payload.item.id, payload.reason || void 0),
		onSuccess: () => {
			toast("Demande refusée");
			invalidateAll();
			setRejectTarget(null);
			setRejectReason("");
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de refuser cette demande.");
		}
	});
	const pendingActionId = approveMutation.isPending && approveMutation.variables ? approveMutation.variables.id : rejectMutation.isPending && rejectMutation.variables ? rejectMutation.variables.item.id : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "agency",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
						className: "mt-1 h-[22px] w-[22px] shrink-0",
						strokeWidth: 1.6
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[24px] font-bold tracking-tight",
							children: "Invitations"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[14px] text-muted-foreground",
							children: "Demandes de rattachement reçues et suivi de vos demandes envoyées."
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-7",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
						title: "Demandes reçues",
						description: "Un utilisateur souhaite rejoindre votre agence — acceptez ou refusez sa demande.",
						children: receivedQuery.isLoading ? null : received.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune demande en attente." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
							columns: receivedColumns((item) => approveMutation.mutate(item), (item) => {
								setRejectTarget(item);
								setRejectReason("");
							}, pendingActionId),
							rows: received,
							isLoading: receivedQuery.isLoading
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-9",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
						title: "Mes demandes envoyées",
						description: "Suivi des demandes de rattachement que vous avez envoyées à d'autres agences.",
						children: sentQuery.isLoading ? null : sent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Vous n'avez envoyé aucune demande." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
							columns: sentColumns,
							rows: sent,
							isLoading: sentQuery.isLoading
						})
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
			open: rejectTarget !== null,
			onOpenChange: (open) => {
				if (!open) {
					setRejectTarget(null);
					setRejectReason("");
				}
			},
			title: "Refuser la demande",
			description: rejectTarget ? `Refuser la demande de rattachement de ${rejectTarget.user}. Un message est optionnel.` : "Un message est optionnel.",
			confirmLabel: rejectMutation.isPending ? "Envoi..." : "Refuser",
			onConfirm: () => {
				if (!rejectTarget) return;
				rejectMutation.mutate({
					item: rejectTarget,
					reason: rejectReason.trim()
				});
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
				label: "Message (optionnel)",
				rows: 4,
				value: rejectReason,
				onChange: (event) => setRejectReason(event.target.value)
			})
		})]
	});
}
//#endregion
export { AgencyInvitationsPage as component };
