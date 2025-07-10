import { type ChangeEvent } from 'react';
import styles from './DatePicker.module.scss';

type DateInputProps = {
  name: string;
  label: string;
  value: string;
  onChange: (date: string) => void;
};

const DateInput: React.FC<DateInputProps> = ({
  name,
  label,
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
        type="date"
        value={value}
        onChange={handleChange}
        className={styles.input}
      />
    </div>
  );
};


export { DateInput };