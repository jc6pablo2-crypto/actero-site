import React from "react";
import { cn } from "../../lib/utils";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

export function ButtonColorful({
    className,
    children,
    ...props
}: ButtonColorfulProps) {
    return (
        <button
            className={cn(
                "relative px-5 py-2.5 rounded-full overflow-hidden font-semibold shadow-md",
                "bg-zinc-100", // Dark mode default (white bg)
                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                "group",
                className
            )}
            {...props}
        >
            {/* Gradient background effect */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                    "opacity-40 group-hover:opacity-80",
                    "blur transition-opacity duration-500"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2 text-zinc-900">
                {children}
            </div>
        </button>
    );
}
