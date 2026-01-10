"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createGroupAction } from "@/actions/groups";
import { ClayButton } from "@/components/ui/clay-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <ClayButton
      type="submit"
      variant="primary"
      isLoading={pending}
      disabled={pending}
      className="w-full"
    >
      Create Tribe
    </ClayButton>
  );
}

export function CreateGroupDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useActionState(createGroupAction, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-stone-50 border-stone-200 shadow-clay rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-stone-800">
            Create New Tribe
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            Start a new circle for your team, friends, or family.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-stone-700 font-bold">
              Tribe Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. The Avengers"
              className="bg-stone-100 border-stone-200 focus-visible:ring-aura-gold/50 rounded-xl h-12 shadow-inner"
              required
            />
            {state?.errors?.name && (
              <p className="text-sm text-aura-red">{state.errors.name[0]}</p>
            )}
          </div>



          {state?.message && (
            <p className="text-sm text-aura-red text-center">{state.message}</p>
          )}

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
