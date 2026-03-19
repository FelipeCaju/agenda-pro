import { useId, useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  inputClassName?: string;
};

export function PasswordField({
  className,
  inputClassName,
  id,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={className}>
      <div className="relative">
        <input
          {...props}
          className={inputClassName}
          id={id ?? generatedId}
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition hover:border-brand-200 hover:bg-white hover:text-brand-600"
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
