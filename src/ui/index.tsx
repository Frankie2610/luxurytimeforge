import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';
import clsx, {type ClassValue} from 'clsx';
import {ChevronDown, X} from 'lucide-react';
import {forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode} from 'react';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const buttonVariants = cva('tf-button', {
  variants: {
    variant: {
      primary: 'tf-button--primary',
      secondary: 'tf-button--secondary',
      luxury: 'tf-button--luxury',
      destructive: 'tf-button--destructive',
      ghost: 'tf-button--ghost',
      icon: 'tf-button--icon',
    },
    size: {sm: 'tf-button--sm', md: 'tf-button--md', lg: 'tf-button--lg'},
    full: {true: 'tf-button--full'},
  },
  defaultVariants: {variant: 'primary', size: 'md'},
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & {asChild?: boolean};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({className, variant, size, full, asChild, ...props}, ref) => {
  const Component = asChild ? Slot : 'button';
  return <Component ref={ref} className={cn(buttonVariants({variant, size, full}), className)} {...props}/>;
});
Button.displayName = 'Button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export function DialogContent({children, className, overlayClassName, title, description}: {children: ReactNode; className?: string; overlayClassName?: string; title?: string; description?: string}) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className={cn('tf-dialog-overlay', overlayClassName)}/><DialogPrimitive.Content className={cn('tf-dialog-content', className)}>
    {(title || description) && <header className="tf-dialog-header">{title && <DialogPrimitive.Title>{title}</DialogPrimitive.Title>}{description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}</header>}
    {children}<DialogPrimitive.Close className="tf-dialog-close" aria-label="Đóng"><X/></DialogPrimitive.Close>
  </DialogPrimitive.Content></DialogPrimitive.Portal>;
}
export const DialogClose = DialogPrimitive.Close;

export function Accordion({items, defaultValue}: {items: Array<{id: string; title: ReactNode; content: ReactNode}>; defaultValue?: string}) {
  return <AccordionPrimitive.Root type="single" collapsible defaultValue={defaultValue} className="tf-accordion">
    {items.map(item => <AccordionPrimitive.Item key={item.id} value={item.id} className="tf-accordion-item">
      <AccordionPrimitive.Header><AccordionPrimitive.Trigger className="tf-accordion-trigger"><span>{item.title}</span><ChevronDown/></AccordionPrimitive.Trigger></AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="tf-accordion-content"><div>{item.content}</div></AccordionPrimitive.Content>
    </AccordionPrimitive.Item>)}
  </AccordionPrimitive.Root>;
}

export const Tabs = TabsPrimitive.Root;
export const TabsList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({className, ...props}, ref) => <TabsPrimitive.List ref={ref} className={cn('tf-tabs-list', className)} {...props}/>);
TabsList.displayName = 'TabsList';
export const TabsTrigger = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({className, ...props}, ref) => <TabsPrimitive.Trigger ref={ref} className={cn('tf-tabs-trigger', className)} {...props}/>);
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({className, ...props}, ref) => <TabsPrimitive.Content ref={ref} className={cn('tf-tabs-content', className)} {...props}/>);
TabsContent.displayName = 'TabsContent';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export function DropdownMenuContent({children, className, align = 'end'}: {children: ReactNode; className?: string; align?: 'start'|'center'|'end'}) {
  return <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.Content sideOffset={8} align={align} className={cn('tf-dropdown-content', className)}>{children}</DropdownMenuPrimitive.Content></DropdownMenuPrimitive.Portal>;
}
export const DropdownMenuItem = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>(({className, ...props}, ref) => <DropdownMenuPrimitive.Item ref={ref} className={cn('tf-dropdown-item', className)} {...props}/>);
DropdownMenuItem.displayName = 'DropdownMenuItem';
export const DropdownMenuSeparator = (props: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) => <DropdownMenuPrimitive.Separator className="tf-dropdown-separator" {...props}/>;

export function Surface({className, ...props}: HTMLAttributes<HTMLElement>) { return <section className={cn('tf-surface', className)} {...props}/>; }
