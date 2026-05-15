"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectItem = ({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item className={cn("cursor-pointer rounded px-3 py-2 text-sm outline-none hover:bg-muted", className)} {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);
export const SelectContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content className={cn("z-50 min-w-40 rounded-md border bg-card p-1 shadow", className)} {...props} />
  </SelectPrimitive.Portal>
);
export const SelectTrigger = ({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) => (
  <SelectPrimitive.Trigger className={cn("flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-sm", className)} {...props}>
    {children}
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.Trigger>
);
