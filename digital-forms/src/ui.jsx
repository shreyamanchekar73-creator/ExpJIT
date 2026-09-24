import { createContext, useContext } from 'react';

export const FormModeContext = createContext('edit');
export function useFormMode() {
  return useContext(FormModeContext);
}
export function useLocked() {
  return useFormMode() !== 'edit';
}

export function Hint({ children }) {
  return <p className="hint">{children}</p>;
}

export function Row({ children, className = '' }) {
  return <div className={`row ${className}`}>{children}</div>;
}

export function Field({ label, children, className = '', star }) {
  return (
    <label className={`field ${className}`}>
      {label ? (
        <span className="label">
          {star ? <span className="star">*</span> : null}
          {label}
        </span>
      ) : null}
      {children}
    </label>
  );
}

export function CapsInput({ value, onChange, className = '', readOnly, ...rest }) {
  const locked = useLocked();
  const ro = locked || readOnly;
  return (
    <input
      className={`caps ${className}`}
      value={value}
      readOnly={ro}
      onChange={ro ? undefined : (e) => onChange(e.target.value.toUpperCase())}
      autoComplete="off"
      {...rest}
    />
  );
}

export function DateInput({ value, onChange, readOnly, ...rest }) {
  const locked = useLocked();
  const ro = locked || readOnly;
  return <input type="date" value={value} readOnly={ro} onChange={ro ? undefined : onChange} {...rest} />;
}

export function EmailInput({ value, onChange, className = 'caps', readOnly, ...rest }) {
  const locked = useLocked();
  const ro = locked || readOnly;
  return (
    <input className={className} type="email" value={value} readOnly={ro} onChange={ro ? undefined : onChange} {...rest} />
  );
}

export function CapsArea({ value, onChange, rows = 2, ...rest }) {
  const locked = useLocked();
  return (
    <textarea
      className="caps"
      rows={rows}
      value={value}
      readOnly={locked}
      onChange={locked ? undefined : (e) => onChange(e.target.value.toUpperCase())}
      {...rest}
    />
  );
}

export function Box({ checked, onChange, label, name }) {
  const locked = useLocked();
  return (
    <label className="box">
      <input type="checkbox" name={name} checked={!!checked} disabled={locked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Radio({ name, value, current, onChange, label }) {
  const locked = useLocked();
  return (
    <label className="box">
      <input type="radio" name={name} checked={current === value} disabled={locked} onChange={() => onChange(value)} />
      <span>{label}</span>
    </label>
  );
}

export function MultiBox({ options, values, onChange }) {
  const set = new Set(values || []);
  return (
    <div className="boxes">
      {options.map((opt) => (
        <Box
          key={opt}
          label={opt}
          checked={set.has(opt)}
          onChange={(on) => {
            const next = new Set(set);
            if (on) next.add(opt);
            else next.delete(opt);
            onChange([...next]);
          }}
        />
      ))}
    </div>
  );
}

export function PenBox({ label }) {
  return (
    <div className="pen-box">
      <div className="sig-head">
        <span>{label}</span>
      </div>
      <div className="pen-lines" />
      <p className="sig-note">Leave blank — customer signs here with a pen on the printout</p>
    </div>
  );
}

export function PhotoBox({ value, onChange }) {
  const locked = useLocked();
  return (
    <div className="photo-box">
      {value ? <img src={value} alt="Applicant photograph" /> : <span>Paste photograph on the printout, or add an image here</span>}
      {locked ? null : (
        <label className="photo-btn no-print">
          {value ? 'Change photo' : 'Add photo'}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onChange(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
        </label>
      )}
    </div>
  );
}
