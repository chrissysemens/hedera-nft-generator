import { type ChangeEvent, } from 'react';
import styles from './TextInput.module.scss';

type TextInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
};

export const TextInput: React.FC<TextInputProps> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.inputContainer}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={styles.input}
      />
    </div>
  );
};
