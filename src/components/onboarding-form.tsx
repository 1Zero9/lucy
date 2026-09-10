"use client";

import { useActionState } from "react";
import { completeOnboardingAction, type ActionState } from "@/app/actions";

const initial: ActionState = {};

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initial);

  return (
    <form action={formAction} className="onboard-steps">
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="purpose">What are you using LUCY for?</label>
        <input
          id="purpose"
          name="purpose"
          placeholder="A degree, a certification, a course, personal research…"
        />
      </div>

      <div className="field">
        <label htmlFor="workspaceName">What are you studying or working on?</label>
        <input
          id="workspaceName"
          name="workspaceName"
          required
          placeholder="e.g. Computer Science, CISSP, French B2, Photography"
        />
      </div>

      <div className="field">
        <label htmlFor="moduleName">Name your first module or subject (optional)</label>
        <input id="moduleName" name="moduleName" placeholder="e.g. Algorithms, Domain 1, Grammar" />
      </div>

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Setting up…" : "Create my workspace"}
      </button>
    </form>
  );
}
