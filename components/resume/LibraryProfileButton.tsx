"use client";

import { useState } from "react";

import Button from "@/components/Button";
import { UserIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { fillProfileBlanks } from "@/libs/library/libraryPull";
import { getLibraryProfile } from "@/libs/library/libraryService";
import type { ResumeProfile } from "@/libs/resume/resumeSchema";

/**
 * Fills this resume's blank profile fields from the library profile. Reads the
 * document once rather than subscribing: the action is a deliberate click, so
 * there is nothing to keep in sync afterwards.
 */
export interface LibraryProfileButtonProps {
  profile: ResumeProfile;
  onChange: (next: ResumeProfile) => void;
}

export default function LibraryProfileButton({
  profile,
  onChange,
}: LibraryProfileButtonProps) {
  const { user } = useFirebaseUser();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const library = await getLibraryProfile(user.uid);

      if (!library) {
        notify({
          variant: "error",
          message: "No library profile saved yet — add one in your library.",
        });
        return;
      }

      const { profile: next, filled } = fillProfileBlanks(profile, library);

      // Say so either way, so a click is never silent.
      if (!filled) {
        notify({
          variant: "success",
          message: "Nothing to fill — this profile is already complete.",
        });
        return;
      }

      onChange(next);
      notify({
        variant: "success",
        message: `Filled ${filled} field${filled === 1 ? "" : "s"} from your library.`,
      });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not read your library profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="self-start"
      icon={<UserIcon className="size-4" />}
      disabled={!user || loading}
      onClick={() => void handleClick()}
    >
      {loading ? "Loading…" : "Use library profile"}
    </Button>
  );
}
