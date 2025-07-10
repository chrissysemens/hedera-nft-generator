import { type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type ButtonProps = {
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button className={styles.button} {...props}>
      {children}
    </button>
  );
};