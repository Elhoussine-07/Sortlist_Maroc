import { create } from "zustand";
import type { Agency, Project } from "@/lib/types";

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  shortlist: Agency[];
  isLoading: boolean;
  error: string | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setShortlist: (shortlist: Agency[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  selectedProject: null,
  shortlist: [],
  isLoading: false,
  error: null,
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setShortlist: (shortlist) => set({ shortlist }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ projects: [], selectedProject: null, shortlist: [], error: null }),
}));
