import type {ReactNode} from 'react';
import {Inbox} from 'lucide-react';
import {cn} from './ui';

export function AdminResourceFrame({children,className}:{children:ReactNode;className?:string}){
  return <div className={cn('v25-resource-page',className)}>{children}</div>;
}

export function AdminResourceSurface({children,className}:{children:ReactNode;className?:string}){
  return <section className={cn('v25-resource-surface',className)}>{children}</section>;
}

export function AdminResourceIntro({eyebrow,title,description,actions,className}:{eyebrow?:string;title:string;description?:string;actions?:ReactNode;className?:string}){
  return <header className={cn('v25-resource-intro',className)}>
    <div className="v25-resource-intro-copy">{eyebrow&&<small>{eyebrow}</small>}<h2>{title}</h2>{description&&<p>{description}</p>}</div>
    {actions&&<div className="v25-resource-intro-actions">{actions}</div>}
  </header>;
}

export function AdminEmptyState({icon,title,text,action}:{icon?:ReactNode;title:string;text:string;action?:ReactNode}){
  return <div className="v25-empty-state"><span>{icon||<Inbox/>}</span><h3>{title}</h3><p>{text}</p>{action&&<div>{action}</div>}</div>;
}

export function AdminMetricGrid({children}:{children:ReactNode}){return <section className="v25-metric-grid">{children}</section>}
export function AdminMetric({label,value,help,icon}:{label:string;value:ReactNode;help?:string;icon?:ReactNode}){
  return <article className="v25-metric-card">{icon&&<span>{icon}</span>}<div><small>{label}</small><strong>{value}</strong>{help&&<p>{help}</p>}</div></article>;
}
