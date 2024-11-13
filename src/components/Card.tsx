import { HTMLAttributes } from "react";

// interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
