import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles all redirects, this is just a fallback
  // Redirect to login - middleware will handle proper routing based on auth
  redirect("/login");
}