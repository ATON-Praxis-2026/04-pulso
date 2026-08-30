import Anthropic from "@anthropic-ai/sdk";

/** Chaves identity-linked exigem o header do workspace. Um lugar só para isso. */
export function anthropic() {
  const ws = process.env.ANTHROPIC_WORKSPACE_ID;
  return new Anthropic(ws ? { defaultHeaders: { "anthropic-workspace-id": ws } } : {});
}
