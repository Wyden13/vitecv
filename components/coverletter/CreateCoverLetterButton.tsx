"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { createCoverLetter } from "@/libs/coverLetterService";
import Button from "../Button";
import { PlusIcon } from "../icons";
import { useToast } from "../Toast";

/** Client island, for the same reason as CreateResumeButton. */
export default function CreateCoverLetterButton() {
  const router = useRouter();
  const { user, loading } = useFirebaseUser();
  const { notify } = useToast();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!user) return;

    setCreating(true);
    try {
      const id = await createCoverLetter(user.uid);
      router.push(`/cv/${id}`);
    } catch (caught) {
      setCreating(false);
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not create a cover letter.",
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
