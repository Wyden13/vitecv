import { redirect } from "next/navigation";

import { HOME_ROUTE } from "@/constants";

export default function Home() {
  redirect(HOME_ROUTE);
}
