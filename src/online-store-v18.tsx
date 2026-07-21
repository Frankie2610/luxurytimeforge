import {BarChart3, CheckCircle2, ChevronDown, Code2, Copy, ExternalLink, Eye, Gauge, Globe2, Laptop, MoreHorizontal, Paintbrush, Plus, Smartphone, UploadCloud} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {useCommerce} from './context';
import {OnlineStoreV12} from './admin-sprint12';
import {Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from './ui';

function Metric({label,value,status='Chưa kết nối'}:{label:string;value:string;status?:string}){return <article className="tf39-os-metric"><div><span>{label}</span><strong>{value}</strong></div><em>{status}</em></article>}

export function OnlineStoreV18(){
  const[params,setParams]=useSearchParams();
  const{themeState,draftTheme}=useCommerce();
  const editor=params.get('view')==='editor';
  const[loadTime,setLoadTime]=useState('—');
  useEffect(()=>{const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;if(navigation?.duration)setLoadTime(`${Math.round(navigation.duration)} ms`)},[]);
  const published=themeState.published;
  const templateCount=Object.keys(published.templates).length;
  const updated=useMemo(()=>new Date(themeState.publishedAt).toLocaleString('vi-VN',{dateStyle:'medium',timeStyle:'short'}),[themeState.publishedAt]);
  const openEditor=()=>setParams({view:'editor'});
  const closeEditor=()=>setParams({});

  if(editor)return <div className="tf39-os-editor-page">
    <header className="tf39-os-editor-header">
      <button type="button" onClick={closeEditor} aria-label="Quay lại"><ChevronDown/></button>
      <div className="tf39-os-editor-mode"><span><Paintbrush/></span><div><b>{draftTheme.name}</b><small>Đang tùy chỉnh</small></div><em>Đang hoạt động</em></div>
      <div className="tf39-os-editor-template"><Code2/><span>Template đang chọn trong trình chỉnh sửa</span></div>
      <div className="tf39-os-editor-actions"><Link to="/" target="_blank"><Eye/>Xem cửa hàng</Link></div>
    </header>
    <OnlineStoreV12/>
  </div>;

  return <div className="tf39-os-page">
    <header className="tf39-os-titlebar"><div><span><Globe2/></span><h1>Cửa hàng online</h1></div><div><Button variant="secondary" disabled><Eye/>Công khai</Button><Button asChild variant="secondary"><Link to="/" target="_blank">Xem cửa hàng</Link></Button><Button className="tf39-os-customize" onClick={openEditor}><Paintbrush/>Mở trình tùy chỉnh</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="icon" aria-label="Thao tác khác"><MoreHorizontal/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={()=>navigator.clipboard?.writeText(JSON.stringify(published,null,2))}><Copy/>Sao chép dữ liệu theme</DropdownMenuItem><DropdownMenuItem onSelect={openEditor}><Code2/>Mở trình tùy chỉnh</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem onSelect={()=>window.open('/','_blank')}><ExternalLink/>Mở cửa hàng</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></header>

    <section className="tf39-os-performance"><div className="tf39-os-period"><Gauge/><div><b>30 ngày</b><small>Hiệu suất cửa hàng</small></div></div><Metric label="Tải trang hiện tại" value={loadTime} status="Phiên quản trị"/><Metric label="LCP P75" value="Chưa đo"/><Metric label="INP P75" value="Chưa đo"/><Metric label="Cumulative Layout Shift" value="Chưa đo"/></section>

    <section className="tf39-os-theme-card">
      <div className="tf39-os-preview-stage">
        <div className="tf39-os-desktop-frame"><div className="tf39-os-browser-bar"><i/><i/><i/><span>timeforge.store</span></div><iframe title="Bản xem trước cửa hàng trên máy tính" src="/" tabIndex={-1} loading="lazy"/></div>
        <div className="tf39-os-mobile-frame"><div className="tf39-os-mobile-notch"/><iframe title="Bản xem trước cửa hàng trên điện thoại" src="/" tabIndex={-1} loading="lazy"/></div>
      </div>
      <footer className="tf39-os-theme-footer"><div><div className="tf39-os-theme-name"><h2>{published.name}</h2><span><CheckCircle2/>Đang hoạt động</span></div><p>Lưu gần nhất: {updated}</p><button><i/> {themeState.versions.length?`${themeState.versions.length} phiên bản đã lưu`:'Chưa có phiên bản cũ'} <ChevronDown/></button></div><div className="tf39-os-theme-cta"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="icon"><MoreHorizontal/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={()=>navigator.clipboard?.writeText(JSON.stringify(published,null,2))}><Copy/>Sao chép dữ liệu</DropdownMenuItem><DropdownMenuItem onSelect={()=>window.open('/','_blank')}><ExternalLink/>Xem cửa hàng</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Button onClick={openEditor}><Paintbrush/>Chỉnh sửa theme</Button></div></footer>
    </section>

    <section className="tf39-os-library"><header><div><h2>Thư viện theme</h2><p>Quản lý bản nháp, theme đã lưu và giao diện mới.</p></div><Button variant="secondary"><UploadCloud/>Thêm theme</Button></header><div className="tf39-os-library-grid"><article><span><Laptop/></span><div><small>BẢN NHÁP</small><h3>{draftTheme.name}</h3><p>{templateCount} template · section và block chưa xuất bản.</p></div><Button variant="secondary" onClick={openEditor}>Tùy chỉnh</Button></article><article className="is-add"><span><Plus/></span><div><small>THEME STORE</small><h3>Khám phá giao diện mới</h3><p>Chuẩn bị thêm theme cho chiến dịch hoặc bộ sưu tập khác.</p></div><Button variant="ghost"><Plus/>Thêm theme</Button></article></div></section>
  </div>;
}
