import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: { dim: 24, cls: "h-6 w-6 text-xs" },
  sm: { dim: 32, cls: "h-8 w-8 text-sm" },
  md: { dim: 40, cls: "h-10 w-10 text-base" },
  lg: { dim: 48, cls: "h-12 w-12 text-lg" },
  xl: { dim: 80, cls: "h-20 w-20 text-2xl" },
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { dim, cls } = sizes[size];
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={dim}
        height={dim}
        className={cn("rounded-full object-cover", cls, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white",
        cls,
        className
      )}
    >
      {initials}
    </div>
  );
}
