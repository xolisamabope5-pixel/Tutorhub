import { useNavigate } from "react-router-dom";

/** Consistent in-app back navigation with a safe TutorHub fallback. */
export default function BackButton({ fallback = "/", to }) {
  const navigate = useNavigate();

  const goBack = () => {
    // Use an explicit workspace destination when supplied; history can point to
    // the public homepage if a user entered a classroom from a dashboard card.
    if (to) {
      navigate(to, { replace: true });
      return;
    }
    // Avoid sending users outside TutorHub when this page was opened directly.
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button type="button" onClick={goBack} className="tutorhub-back-button" aria-label="Go back">
      ← Back
    </button>
  );
}
