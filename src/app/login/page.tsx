import { redirect } from "next/navigation";
import { session } from "@/lib/auth";
import { isDemo } from "@/lib/store";
import { LoginForm } from "@/components/login-form";
export const metadata = { title: "Entrar" };
export default async function Login() { if (await session()) redirect("/"); return <LoginForm demo={Boolean(isDemo())}/>; }
