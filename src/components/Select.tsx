interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = ({
  className = "",
  error,
  children,
  ...props
}: SelectProps) => {
  return (
    <select
      className={`w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-500" : "border-gray-300"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
