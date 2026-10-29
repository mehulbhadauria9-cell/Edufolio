import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function FormField({ label, type = 'text', value, onChange, autoComplete, required = true, error, placeholder, ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-xl border border-slate-700/60 bg-[#0E131F] px-3.5 py-2.5 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-500/80"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            data-cursor-hover
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-status-error">
          {error}
        </p>
      )}
    </div>
  );
}
