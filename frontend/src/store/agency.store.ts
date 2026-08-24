import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgencyMembership {
  id: string;
  initials: string;
  name: string;
  tagline: string;
  membership: "owner" | "member";
}

interface AgencyState {
  activeAgencyId: string | null;
  agencies: AgencyMembership[];
  setActiveAgency: (agencyId: string | null) => void;
  setAgencies: (agencies: AgencyMembership[]) => void;
}

export const useAgencyStore = create<AgencyState>()(
  persist(
    (set) => ({
      activeAgencyId: null,
      agencies: [],
      setActiveAgency: (agencyId) => set({ activeAgencyId: agencyId }),
      setAgencies: (agencies) => set({ agencies }),
    }),
    {
      name: "agency-storage",
      partialize: (state) => ({
        activeAgencyId: state.activeAgencyId,
        agencies: state.agencies,
      }),
    },
  ),
);
