"use client";

export function DeleteButton({
  action,
  label,
  confirmText,
}: {
  action: () => Promise<void>;
  label: string;
  confirmText: string;
}) {
  return (
    <button
      formAction={action}
      formNoValidate
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="btn text-rose-600 hover:bg-rose-50"
    >
      {label}
    </button>
  );
}
