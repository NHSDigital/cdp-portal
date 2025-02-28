import { SyntheticEvent, useState } from "react";
import { UserToAdd } from "./types";
import { useRouter } from "next/navigation";
import { createOneUserCommon } from "./serverActions";

interface UseSubmissionStatus {
  users_to_display: UserToAdd[];
  agreement_id: string;
}

export interface Progress {
  completed: number;
  overall: number;
}

export default function useSubmitUsers({
  users_to_display,
  agreement_id,
}: UseSubmissionStatus) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  async function submitUsers(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) {
    const form_data = new FormData(event.target as any);
    const final_confirm = form_data.get("final_confirm");
    if (!final_confirm) {
      setError("You must confirm that these details are correct");
      return;
    }
    setIsSubmitting(true);
    setProgress({ completed: 0, overall: users_to_display.length });

    try {
      for (const user of users_to_display) {
        await createOneUserCommon(
          agreement_id,
          user.email,
          user.role,
          user.first_name,
          user.last_name
        );
        setProgress((currentProgress: Progress) => ({
          ...currentProgress,
          completed: currentProgress.completed + 1,
        }));
      }
    } catch (error) {
      console.error("Error submitting users: ", error);
      router.push("/500");
      return;
    }

    sessionStorage.removeItem("add_user_form");

    document.cookie = "add_user_form=;max-age=0;path=/";

    const success_message =
      users_to_display.length == 1
        ? `${users_to_display[0].first_name} ${users_to_display[0].last_name} added successfully`
        : `${users_to_display.length} users added successfully`;
    document.cookie = `manage_users_success_message=${encodeURIComponent(
      success_message
    )}; expires=${new Date(Date.now() + 30 * 1000).toUTCString()}; path=/`;

    router.push(`/agreement/${agreement_id}/manage-users`);
  }

  return { isSubmitting, submitUsers, progress, error };
}
