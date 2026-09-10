"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { createWorkspace, getWorkspace } from "@/lib/db/workspaces";
import { createModule } from "@/lib/db/modules";
import { setActiveWorkspace } from "@/lib/workspace-context";
import { requiredString, optionalString, ValidationError } from "@/lib/validation";

export type ActionState = { error?: string };

export async function createWorkspaceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  let workspaceId: string;
  try {
    const workspace = await createWorkspace(getDb(), user.id, {
      name: requiredString(formData.get("name"), { field: "Workspace name", max: 120 }),
      purpose: optionalString(formData.get("purpose"), { field: "Purpose", max: 240 })
    });
    workspaceId = workspace.id;
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    throw err;
  }
  await setActiveWorkspace(workspaceId);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function completeOnboardingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const db = getDb();
  let workspaceId: string;
  try {
    const purpose = optionalString(formData.get("purpose"), { field: "Purpose", max: 240 });
    const workspace = await createWorkspace(db, user.id, {
      name: requiredString(formData.get("workspaceName"), {
        field: "What you're studying or working on",
        max: 120
      }),
      purpose
    });
    workspaceId = workspace.id;

    const firstModule = optionalString(formData.get("moduleName"), {
      field: "First module",
      max: 120
    });
    if (firstModule) {
      await createModule(db, user.id, { workspaceId, name: firstModule });
    }
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    throw err;
  }
  await setActiveWorkspace(workspaceId);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function switchWorkspaceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("workspaceId") ?? "");
  const workspace = id ? await getWorkspace(getDb(), user.id, id) : null;
  if (workspace) {
    await setActiveWorkspace(workspace.id);
    revalidatePath("/", "layout");
  }
  redirect("/");
}
