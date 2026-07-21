import {useEffect,useMemo,useState} from 'react';
import {ArrowDown,ArrowUp,BookOpen,Check,ExternalLink,FileText,Plus,Save,ShieldCheck,Trash2,Truck,Undo2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {type ManagedContentPage,type ManagedContentPageSlug,useManagedContentPages} from './content-pages-v23';

const iconFor=(slug:ManagedContentPageSlug)=>slug==='about'?<BookOpen/>:slug==='warranty'?<ShieldCheck/>:slug==='shipping'?<Truck/>:<Undo2/>;

export function ContentPagesAdminV23(){
  const{pages,savePage}=useManagedContentPages();
  const[selected,setSelected]=useState<ManagedContentPageSlug>('about');
  const current=useMemo(()=>pages.find(page=>page.slug===selected)||pages[0],[pages,selected]);
  const[draft,setDraft]=useState<ManagedContentPage>(()=>structuredClone(current));
  const[saving,setSaving]=useState(false);

  useEffect(()=>setDraft(structuredClone(current)),[current]);

  const dirty=JSON.stringify(draft)!==JSON.stringify(current);
  const patch=<K extends keyof ManagedContentPage>(key:K,value:ManagedContentPage[K])=>setDraft(valueDraft=>({...valueDraft,[key]:value}));
  const patchSection=(id:string,key:'title'|'body',value:string)=>patch('sections',draft.sections.map(section=>section.id===id?{...section,[key]:value}:section));
  const moveSection=(index:number,direction:-1|1)=>{
    const target=index+direction;if(target<0||target>=draft.sections.length)return;
    const next=[...draft.sections];[next[index],next[target]]=[next[target],next[index]];patch('sections',next);
  };
  const addSection=()=>patch('sections',[...draft.sections,{id:`${draft.slug}-${crypto.randomUUID()}`,title:'Nội dung mới',body:'Nhập nội dung chính sách tại đây.'}]);
  const removeSection=(id:string)=>{if(draft.sections.length<=1){toast.error('Trang cần ít nhất một mục nội dung.');return}patch('sections',draft.sections.filter(section=>section.id!==id))};
  const save=async()=>{
    if(!draft.title.trim()||!draft.lead.trim()||draft.sections.some(section=>!section.title.trim()||!section.body.trim())){toast.error('Điền đủ tiêu đề, mô tả và nội dung từng mục.');return}
    setSaving(true);
    try{await savePage({...draft,label:current.label});toast.success(`Đã lưu trang ${current.label}.`)}
    catch(error){toast.error(error instanceof Error?error.message:'Không thể lưu trang nội dung.')}
    finally{setSaving(false)}
  };

  return <div className="tf4923-pages-admin">
    <section className="tf4923-pages-overview">
      <div><span><FileText/>NỘI DUNG CỬA HÀNG</span><h2>Biên tập các trang thông tin</h2><p>Quản lý trang Giới thiệu và chính sách sau bán hàng. Nội dung lưu tại đây được dùng trực tiếp trên website khách.</p></div>
      <div className="tf4923-pages-status"><b>{pages.filter(page=>page.published).length}/{pages.length}</b><span>Trang đang hiển thị</span></div>
    </section>

    <div className="tf4923-pages-workspace">
      <aside className="tf4923-pages-list" aria-label="Danh sách trang chính sách">
        <header><span>NỘI DUNG CỬA HÀNG</span><h3>Trang thông tin</h3></header>
        {pages.map(page=><button key={page.slug} className={selected===page.slug?'is-active':''} onClick={()=>setSelected(page.slug)}>
          <i>{iconFor(page.slug)}</i><span><b>{page.label}</b><small>/pages/{page.slug}</small></span><em className={page.published?'is-live':''}>{page.published?'Đang hiện':'Đang ẩn'}</em>
        </button>)}
        <div className="tf4923-pages-list-note"><Check/><span>Nội dung được lưu riêng, không phụ thuộc trình tùy chỉnh theme.</span></div>
      </aside>

      <main className="tf4923-page-editor">
        <header className="tf4923-page-editor-head">
          <div><small>CHỈNH SỬA TRANG</small><h2>{current.label}</h2><p>Cập nhật lần cuối {new Date(current.updatedAt).toLocaleString('vi-VN')}</p></div>
          <div><Link to={`/pages/${current.slug}`} target="_blank"><ExternalLink/>Xem trang</Link><button className="tf4923-save-page" disabled={!dirty||saving} onClick={()=>void save()}><Save/>{saving?'Đang lưu…':'Lưu thay đổi'}</button></div>
        </header>

        <section className="tf4923-page-editor-card tf4923-page-basics">
          <header><div><span>01</span><h3>Tiêu đề và phần mở đầu</h3></div><label className="tf4923-page-toggle"><span><b>Hiển thị trên website</b><small>Tắt để tạm ẩn trang khỏi khách truy cập.</small></span><input type="checkbox" checked={draft.published} onChange={event=>patch('published',event.target.checked)}/></label></header>
          <div className="tf4923-page-fields">
            <label><span>Nhãn phía trên</span><input value={draft.eyebrow} onChange={event=>patch('eyebrow',event.target.value)}/></label>
            <label className="is-wide"><span>Tiêu đề trang</span><input value={draft.title} onChange={event=>patch('title',event.target.value)}/></label>
            <label className="is-wide"><span>Mô tả mở đầu</span><textarea rows={3} value={draft.lead} onChange={event=>patch('lead',event.target.value)}/></label>
          </div>
        </section>

        <section className="tf4923-page-editor-card tf4923-page-sections">
          <header><div><span>02</span><h3>Các mục nội dung</h3><p>Mỗi mục được trình bày thành một khối rõ ràng trên website khách.</p></div><button onClick={addSection}><Plus/>Thêm mục</button></header>
          <div>{draft.sections.map((section,index)=><article key={section.id}>
            <div className="tf4923-section-number"><span>{String(index+1).padStart(2,'0')}</span><div><button disabled={index===0} onClick={()=>moveSection(index,-1)} aria-label="Đưa mục lên"><ArrowUp/></button><button disabled={index===draft.sections.length-1} onClick={()=>moveSection(index,1)} aria-label="Đưa mục xuống"><ArrowDown/></button></div></div>
            <div className="tf4923-section-fields"><label><span>Tiêu đề mục</span><input value={section.title} onChange={event=>patchSection(section.id,'title',event.target.value)}/></label><label><span>Nội dung</span><textarea rows={5} value={section.body} onChange={event=>patchSection(section.id,'body',event.target.value)}/></label></div>
            <button className="tf4923-delete-section" onClick={()=>removeSection(section.id)} aria-label="Xóa mục"><Trash2/></button>
          </article>)}</div>
        </section>

        <footer className="tf4923-page-editor-footer"><span className={dirty?'is-dirty':''}>{dirty?'Có thay đổi chưa lưu':'Nội dung đã được lưu'}</span><button disabled={!dirty||saving} onClick={()=>void save()}><Save/>{saving?'Đang lưu…':'Lưu thay đổi'}</button></footer>
      </main>
    </div>
  </div>;
}
