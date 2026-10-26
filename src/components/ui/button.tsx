import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border border-transparent font-semibold transition-all outline-none select-none focus-visible:outline-3 focus-visible:outline-brand-green focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "btn-cta",
        cta: "btn-cta",
        secondary: "btn-secondary",
        outline:
          "btn-ghost border-warm-border bg-surface-raised text-ink hover:border-brand-green-light",
        ghost:
          "border-transparent bg-transparent text-ink hover:bg-brand-green-light hover:text-brand-green-ink",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:outline-destructive",
        link: "text-brand-green-dark underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        xs: "min-h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-9 gap-1.5 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-12 gap-2 px-6 text-base",
        icon: "size-10 min-h-0 p-0",
        "icon-sm": "size-8 min-h-0 p-0",
        "icon-lg": "size-12 min-h-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
