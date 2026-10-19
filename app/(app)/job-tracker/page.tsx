"use client";

import { useCallback, useEffect, useState } from "react";

import JobTrackerBoard from "@/components/job-tracker/JobTrackerBoard";
import JobTrackerForm from "@/components/job-tracker/JobTrackerForm";
import JobTrackerList from "@/components/job-tracker/JobTrackerList";
import Button from "@/components/Button";
import { PlusIcon } from "@/components/icons";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";
import { useToast } from "@/components/Toast";
import ViewSwitcher from "@/components/ViewSwitcher";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import {
  createJobApplication,
  deleteJobApplication,
  subscribeToJobApplications,
  updateJobApplication,
} from "@/libs/jobtracker/jobTrackerService";
import type {
  JobApplication,
  JobApplicationInput,
  JobApplicationStatus,
} from "@/libs/jobtracker/jobTrackerSchema";

type TrackerView = "board" | "table";

const TRACKER_VIEWS: { id: TrackerView; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "table", label: "Table" },
];

export default function JobTrackerPage() {
  const { user, loading: authLoading } = useFirebaseUser();
  const { notify } = useToast();

  const [applications, setApplications] = useState<JobApplication[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<TrackerView>("board");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    return subscribeToJobApplications(user.uid, {
      onData: (next) => {
        setApplications(next);
        setError(null);
      },
      onError: (caught) => setError(caught.message),
    });
  }, [user]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const handleSubmit = useCallback(
    async (input: JobApplicationInput) => {
      if (!user) return;

      setSaving(true);
      try {
        if (editing) {
          await updateJobApplication(user.uid, editing.id, input);
          notify({ variant: "success", message: `Updated ${input.company}` });
        } else {
          await createJobApplication(user.uid, input);
          notify({ variant: "success", message: `Tracking ${input.company}` });
        }
        closeForm();
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not save this application.",
        });
      } finally {
        setSaving(false);
      }
    },
    [user, editing, notify, closeForm],
  );

  const handleStatusChange = useCallback(
    async (application: JobApplication, status: JobApplicationStatus) => {
      if (!user) return;

      try {
        await updateJobApplication(user.uid, application.id, { status });
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not change the status.",
        });
      }
    },
    [user, notify],
  );

  const handleDelete = useCallback(
    async (application: JobApplication) => {
      if (!user) return;

      setDeletingId(application.id);
      try {
        await deleteJobApplication(user.uid, application.id);
        notify({
          variant: "success",
          message: `Deleted ${application.company || "application"}`,
        });
        if (editing?.id === application.id) closeForm();
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not delete this application.",
        });
      } finally {
        setDeletingId(null);
        setConfirmingId(null);
      }
    },
    [user, notify, editing, closeForm],
  );

  const startEdit = useCallback((application: JobApplication) => {
    setEditing(application);
    setFormOpen(true);
  }, []);

  return (
    <PageShell header="Job Tracker" actions={<UserMenu />}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Applications
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Every role you are chasing, and what you owe it next.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ViewSwitcher
            options={TRACKER_VIEWS}
            value={view}
            onChange={setView}
            label="Tracker views"
          />

          {!formOpen && (
            <Button
              variant="primary"
              className="border-dashed"
              icon={<PlusIcon className="size-4" />}
              onClick={() => setFormOpen(true)}
            >
              Add application
            </Button>
          )}
        </div>

        {formOpen && (
          <div className="mt-3">
            <JobTrackerForm
              key={editing?.id ?? "new"}
              editing={editing}
              saving={saving}
              onClose={closeForm}
              onSubmit={(input) => void handleSubmit(input)}
            />
          </div>
        )}

        <div className="mt-4">
          <Content
            authLoading={authLoading}
            signedIn={Boolean(user)}
            applications={applications}
            error={error}
            view={view}
            now={now}
            confirmingId={confirmingId}
            deletingId={deletingId}
            onEdit={startEdit}
            onConfirmDelete={setConfirmingId}
            onStatusChange={(application, status) =>
              void handleStatusChange(application, status)
            }
            onDelete={(application) => void handleDelete(application)}
          />
        </div>
      </div>
    </PageShell>
  );
}

function Content({
  authLoading,
  signedIn,
  applications,
  error,
  view,
  now,
  confirmingId,
  deletingId,
  onEdit,
  onConfirmDelete,
  onStatusChange,
  onDelete,
}: {
  authLoading: boolean;
  signedIn: boolean;
  applications: JobApplication[] | null;
  error: string | null;
  view: TrackerView;
  now: number;
  confirmingId: string | null;
  deletingId: string | null;
  onEdit: (application: JobApplication) => void;
  onConfirmDelete: (id: string | null) => void;
  onStatusChange: (
    application: JobApplication,
    status: JobApplicationStatus,
  ) => void;
  onDelete: (application: JobApplication) => void;
}) {
  if (authLoading || (signedIn && applications === null && !error)) {
    return <Message>Loading your applications…</Message>;
  }

  if (!signedIn) return <Message>Sign in to track your applications.</Message>;

  if (error) {
    return (
      <Message tone="error">Could not load your applications: {error}</Message>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <Message>
        Nothing tracked yet — add an application above, or run a job match and
        track it from there.
      </Message>
    );
  }

  if (view === "table") {
    return (
      <JobTrackerList
        applications={applications}
        now={now}
        confirmingId={confirmingId}
        deletingId={deletingId}
        onEdit={onEdit}
        onConfirmDelete={onConfirmDelete}
        onDelete={onDelete}
      />
    );
  }

  return (
    <JobTrackerBoard
      applications={applications}
      now={now}
      confirmingId={confirmingId}
      deletingId={deletingId}
      onEdit={onEdit}
      onConfirmDelete={onConfirmDelete}
      onStatusChange={onStatusChange}
      onDelete={onDelete}
    />
  );
}

function Message({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <p
      className={`text-sm ${
        tone === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-600 dark:text-zinc-400"
      }`}
    >
      {children}
    </p>
  );
}
