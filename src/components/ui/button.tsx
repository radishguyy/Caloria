import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all outline-none select-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "btn-cta",
        cta: "btn-cta",
        secondary: "btn-secondary",
        outline: "btn-ghost text-ink hover:bg-brand-green-light",
        ghost:
          "bg-transparent text-ink hover:bg-brand-green-light hover:text-brand-green-ink focus-visible:bg-brand-green-light",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:bg-destructive/20",
        link: "text-brand-green-dark underline-offset-4 hover:underline focus-visible:underline",
      },
      size: {
        default: "",
        xs: "min-h-7 gap-1 px-2 text-xs",
        sm: "min-h-9 gap-1.5 px-3 text-xs",
        lg: "min-h-12 gap-2 px-6 text-base",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

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
  );
}

export { Button, buttonVariants };
