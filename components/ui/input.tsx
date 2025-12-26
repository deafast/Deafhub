'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm",
                    "ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-[#22D3EE]/50 focus-visible:border-[#22D3EE]/50 transition-all duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-50 text-white",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

export { Input };
