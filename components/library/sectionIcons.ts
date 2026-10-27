import type { ReactNode } from "react";

import {
  BriefcaseIcon,
  CheckIcon,
  FileTextIcon,
  GraduationCapIcon,
  LayoutGridIcon,
  SparkleIcon,
  UserIcon,
  type IconProps,
} from "@/components/icons";
import { PROFILE_SECTION_KEY } from "@/libs/library/librarySchema";

export type SectionIcon = (props: IconProps) => ReactNode;

/**
 * Keyed by preset id, so an imported section such as Projects or Awards picks
 * up a sensible glyph without being a built-in library section. Anything
 * unrecognised — including the generic custom presets — falls back to the grid.
 */
const ICONS: Record<string, SectionIcon> = {
  [PROFILE_SECTION_KEY]: UserIcon,
  "work-experience": BriefcaseIcon,
  experience: BriefcaseIcon,
  internships: BriefcaseIcon,
  volunteering: BriefcaseIcon,
  leadership: BriefcaseIcon,
  education: GraduationCapIcon,
  courses: GraduationCapIcon,
  skills: SparkleIcon,
  "technical-skills": SparkleIcon,
  languages: SparkleIcon,
  certificates: CheckIcon,
  awards: CheckIcon,
  summary: FileTextIcon,
  publications: FileTextIcon,
  references: FileTextIcon,
};

export function sectionIcon(presetId: string): SectionIcon {
  return ICONS[presetId] ?? LayoutGridIcon;
}
