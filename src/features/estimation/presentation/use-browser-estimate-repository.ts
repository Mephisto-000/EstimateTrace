"use client";

import { useState, useSyncExternalStore } from "react";

import {
  createBrowserEstimateRepository,
  LocalEstimateRepository,
} from "@/features/estimation/infrastructure/local-estimate-repository";

const subscribeToHydration = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
let browserSessionRepository: LocalEstimateRepository | null = null;

function createRepository(): LocalEstimateRepository {
  if (typeof window === "undefined") {
    return new LocalEstimateRepository(null);
  }
  browserSessionRepository ??= createBrowserEstimateRepository();
  return browserSessionRepository;
}

export function useBrowserEstimateRepository(): {
  readonly hydrated: boolean;
  readonly repository: LocalEstimateRepository;
} {
  const [repository] = useState(createRepository);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  return { hydrated, repository };
}
