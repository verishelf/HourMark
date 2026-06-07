import { useRouter } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StorySubmissionForm } from "@/components/stories/StorySubmissionForm";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { useAuth } from "@/hooks/useAuth";

export default function StorySubmitScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <LoggedOutGate message="Sign in to submit your collector story.">
      <FeatureScreenScaffold title="Collector Spotlight" subtitle="Share your story">
        {user ? (
          <StorySubmissionForm userId={user.id} onSuccess={() => router.back()} />
        ) : null}
      </FeatureScreenScaffold>
    </LoggedOutGate>
  );
}
