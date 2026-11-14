import { ComplaintsPage } from "@/features/complaints";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <ComplaintsPage initialTab={tab === "discipline" ? "discipline" : "complaints"} />;
}
