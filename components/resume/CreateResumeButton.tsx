"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { createBlankResume } from "@/libs/resumeService";
import Button from "../Button";
import { PlusIcon } from "../icons";
import { useToast } from "../Toast";

/**
 * Starts an empty resume and opens it.
 *
 * A client island rather than a link: the document has to exist before there
 * is an id to navigate to, and the page around it is a server component.
 */
export default function CreateResumeButton() {
  const router = useRouter();
  const { user, loading } = useFirebaseUser();
  const { notify } = useToast();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!user) return;

    setCreating(true);
    try {
      const id = await createBlankResume(user.uid);
      router.push(`/resume/${id}`);
    } catch (caught) {
      setCreating(false);
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not create a resume.",
      });
    }
  };

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => void create()}
      disabled={loading || !user || creating}
      icon={<PlusIcon className="size-4" />}
    >
      {creating ? "Creating…" : "Create"}
    </Button>
  );
}
