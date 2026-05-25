import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full bg-transparent border-b border-rule-strong px-0 font-mono text-[13px] text-paper placeholder:text-paper-subtle focus:outline-none focus:border-amber transition-colors',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'
