import { Suspense } from "react";

import CoverLetterEditor from "@/components/coverletter/CoverLetterEditor";

export default function CoverLetterEditorPage({
  params,
}: PageProps<"/cv/[id]">) {
  return (
    <Suspense fallback={<EditorFallback />}>
      <CoverLetterEditorLoader params={params} />
    </Suspense>
  );
}

/** `params` is runtime data, so awaiting it has to happen inside the boundary. */
async function CoverLetterEditorLoader({
  params,
}: {
  params: PageProps<"/cv/[id]">["params"];
}) {
  const { id } = await params;
  return <CoverLetterEditor letterId={id} />;
}

function EditorFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading cover letter…
      </p>
    </div>
  );
}
