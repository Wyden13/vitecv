"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export type ProcessingStage =
  | "idle"
  | "validating"
  | "extracting"
  | "saving"
  | "completed"
  | "failed";

interface UploadProgressValue {
  stage: ProcessingStage;
  setStage: (stage: ProcessingStage) => void;
  reset: () => void;
  isProcessing: boolean;
}

const UploadProgressContext =
  createContext<UploadProgressValue | null>(null);

export function useUploadProgress(): UploadProgressValue {
  const context = useContext(UploadProgressContext);

  if (!context) {
    throw new Error(
      "useUploadProgress must be used inside UploadProgressProvider"
    );
  }

  return context;
}

export function UploadProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stage, setStage] = useState<ProcessingStage>("idle");

  const reset = useCallback(() => {
    setStage("idle");
  }, []);

  const isProcessing =
    stage === "validating" ||
    stage === "extracting" ||
    stage === "saving";

  return (
    <UploadProgressContext.Provider
      value={{
        stage,
        setStage,
        reset,
        isProcessing,
      }}
    >
      {children}
    </UploadProgressContext.Provider>
  );
}

const STAGE_LABELS: Record<ProcessingStage, string> = {
  idle: "",
  validating: "Validating document...",
  extracting: "Extracting document content...",
  saving: "Saving resume data...",
  completed: "Resume processed successfully",
  failed: "Resume processing failed",
};

export function UploadProgressBar() {
  const { stage, isProcessing } = useUploadProgress();

  if (stage === "idle") return null;

  return (
    <div className="w-full space-y-2">
      <div
        role={isProcessing ? "progressbar" : "status"}
        aria-label="Resume processing"
        aria-valuetext={STAGE_LABELS[stage]}
        className="h-1 w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className={`h-full bg-accent transition-all duration-300 ${
            isProcessing
              ? "w-full origin-left animate-pulse"
              : stage === "completed"
                ? "w-full"
                : "w-0"
          }`}
        />
      </div>

      <p aria-live="polite" className="text-xs text-zinc-500 p-4">
        {STAGE_LABELS[stage]}
      </p>
    </div>
  );
}
