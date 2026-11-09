"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";

export function useProjects() {
  const {
    projects,
    isLoading,
    loadProjects,
    createProject,
    duplicateProject,
    removeProject,
  } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    isLoading,
    createProject,
    duplicateProject,
    removeProject,
  };
}
