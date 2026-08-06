import { Icon } from "./med-icon";

/** Small status toast with a dismiss button. Shared by pages that use a notice. */
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <Icon name="check" size={17} />
      {message}
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
