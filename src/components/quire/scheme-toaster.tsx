import { Toaster } from "sonner";

export function SchemeToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-cream text-fg border-rule font-sans",
        },
      }}
    />
  );
}
