import { connection } from "next/server";
import GameShell from "@/components/GameShell";
import { rankedEnabled } from "@/server/config";

export default async function Page() {
  // Request time, not build time: whether ranked exists depends on the
  // deploy env, which the build never sees.
  await connection();
  return <GameShell rankedEnabled={rankedEnabled()} />;
}
