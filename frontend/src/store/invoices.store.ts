import { create } from "zustand";
import type { Invoice } from "@/lib/types";

interface InvoicesState {
  invoices: Invoice[];
  totalPaid: number | null;
  pendingAmount: number | null;
  isLoading: boolean;
  error: string | null;
  setInvoices: (invoices: Invoice[]) => void;
  setSummary: (summary: { totalPaid: number; pendingAmount: number }) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useInvoicesStore = create<InvoicesState>((set) => ({
  invoices: [],
  totalPaid: null,
  pendingAmount: null,
  isLoading: false,
  error: null,
  setInvoices: (invoices) => set({ invoices }),
  setSummary: ({ totalPaid, pendingAmount }) => set({ totalPaid, pendingAmount }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ invoices: [], totalPaid: null, pendingAmount: null, error: null }),
}));
