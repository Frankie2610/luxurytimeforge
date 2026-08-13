import {X} from 'lucide-react';
import {createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useRef, type ButtonHTMLAttributes, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

type StorefrontButtonVariant='primary'|'secondary'|'luxury'|'destructive'|'ghost'|'icon';
type StorefrontButtonSize='sm'|'md'|'lg';
type StorefrontButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:StorefrontButtonVariant;size?:StorefrontButtonSize;full?:boolean};

export const StorefrontButton=forwardRef<HTMLButtonElement,StorefrontButtonProps>(({className='',variant='primary',size='md',full=false,...props},ref)=><button
  ref={ref}
  className={['tf-button',`tf-button--${variant}`,`tf-button--${size}`,full?'tf-button--full':'',className].filter(Boolean).join(' ')}
  {...props}
/>);
StorefrontButton.displayName='StorefrontButton';

type DialogState={open:boolean;close:()=>void};
const StorefrontDialogContext=createContext<DialogState>({open:false,close:()=>{}});

export function StorefrontDialog({open=false,onOpenChange,children}:{open?:boolean;onOpenChange?:(open:boolean)=>void;children:ReactNode}){
  const close=useCallback(()=>onOpenChange?.(false),[onOpenChange]);
  const value=useMemo(()=>({open,close}),[open,close]);
  return <StorefrontDialogContext.Provider value={value}>{children}</StorefrontDialogContext.Provider>;
}

export function StorefrontDialogContent({children,className='',overlayClassName='',title,description}:{children:ReactNode;className?:string;overlayClassName?:string;title?:string;description?:string}){
  const{open,close}=useContext(StorefrontDialogContext);
  const panelRef=useRef<HTMLDivElement>(null);
  const titleId=useId();
  const descriptionId=useId();
  useEffect(()=>{
    if(!open)return;
    const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const panel=panelRef.current;
    const focusable=()=>[...(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')||[])];
    requestAnimationFrame(()=>focusable()[0]?.focus());
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();close();return}
      if(event.key!=='Tab')return;
      const items=focusable();
      if(!items.length){event.preventDefault();panel?.focus();return}
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    document.addEventListener('keydown',onKeyDown);
    return()=>{document.removeEventListener('keydown',onKeyDown);document.body.style.overflow=previousOverflow;previousFocus?.focus()};
  },[open,close]);
  if(!open||typeof document==='undefined')return null;
  return createPortal(<div className={`tf-dialog-overlay ${overlayClassName}`} onMouseDown={(event)=>{if(event.target===event.currentTarget)close()}}>
    <div ref={panelRef} className={`tf-dialog-content ${className}`} role="dialog" aria-modal="true" aria-labelledby={title?titleId:undefined} aria-describedby={description?descriptionId:undefined} tabIndex={-1}>
      {(title||description)&&<header className="tf-dialog-header">{title&&<h2 id={titleId}>{title}</h2>}{description&&<p id={descriptionId}>{description}</p>}</header>}
      {children}<button type="button" className="tf-dialog-close" aria-label="Đóng" onClick={close}><X/></button>
    </div>
  </div>,document.body);
}
