import styles from "./FilePicker.module.scss";

type FilePickerProps = {
  name: string;
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
};

export const FilePicker: React.FC<FilePickerProps> = ({
  name,
  label,
  accept = "image/*",
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
  };

  return (
    <div className={styles.inputContainer}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="file"
        accept={accept}
        onChange={handleChange}
        className={styles.filePicker}
      />
    </div>
  );
};
