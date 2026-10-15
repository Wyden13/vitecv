import { Suspense } from "react";

import ResumeEditor from "@/components/resume/ResumeEditor";

export default function ResumeEditorPage({ params }: PageProps<"/resume/[id]">) {
  return (
    <Suspense fallback={<EditorFallback />}>
      <ResumeEditorLoader params={params} />
    </Suspense>
  );
}

/** `params` is runtime data, so awaiting it has to happen inside the boundary. */
async function ResumeEditorLoader({
  params,
}: {
  params: PageProps<"/resume/[id]">["params"];
}) {
  const { id } = await params;
  return <ResumeEditor resumeId={id} />;
}

function EditorFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading resume…</p>
    </div>
  );
}
