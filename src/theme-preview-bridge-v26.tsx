import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {isThemePreviewV26} from './theme-preview-v26';

const SELECTED_ATTRIBUTE = 'data-theme-selected-v26';
const SELECTED_BLOCK_ATTRIBUTE = 'data-theme-block-selected-v27';

export function ThemePreviewBridgeV26() {
  const location = useLocation();
  useEffect(() => {
    if (!isThemePreviewV26()) return;
    document.documentElement.classList.add('tf-theme-preview-document-v26', 'tf-theme-preview-document-v27');
    const clear = () => {
      document.querySelectorAll(`[${SELECTED_ATTRIBUTE}]`).forEach(node => node.removeAttribute(SELECTED_ATTRIBUTE));
      document.querySelectorAll(`[${SELECTED_BLOCK_ATTRIBUTE}]`).forEach(node => node.removeAttribute(SELECTED_BLOCK_ATTRIBUTE));
    };
    const select = (sectionId: string, blockId = '', scroll = false) => {
      clear();
      const section = document.querySelector<HTMLElement>(`[data-theme-section-id="${CSS.escape(sectionId)}"]`);
      if (!section) return;
      section.setAttribute(SELECTED_ATTRIBUTE, 'true');
      const block = blockId ? section.querySelector<HTMLElement>(`[data-theme-block-id="${CSS.escape(blockId)}"]`) : null;
      if (block) block.setAttribute(SELECTED_BLOCK_ATTRIBUTE, 'true');
      if (scroll) (block || section).scrollIntoView({behavior: 'smooth', block: 'center'});
    };
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const block = target?.closest<HTMLElement>('[data-theme-block-id]');
      const section = target?.closest<HTMLElement>('[data-theme-section-id]');
      if (!section) return;
      event.preventDefault();
      event.stopPropagation();
      const sectionId = section.dataset.themeSectionId || '';
      const blockId = block?.dataset.themeBlockId || '';
      if (!sectionId) return;
      select(sectionId, blockId);
      window.parent.postMessage({type: blockId ? 'timeforge:preview-block-selected' : 'timeforge:preview-section-selected', sectionId, blockId}, window.location.origin);
    };
    const submit = (event: Event) => event.preventDefault();
    const message = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'timeforge:editor-selection') return;
      if (event.data.sectionId) select(String(event.data.sectionId), String(event.data.blockId || ''), Boolean(event.data.scroll));
      else clear();
    };
    document.addEventListener('click', click, true);
    document.addEventListener('submit', submit, true);
    window.addEventListener('message', message);
    window.parent.postMessage({type: 'timeforge:preview-ready', path: `${location.pathname}${location.search}`}, window.location.origin);
    return () => {
      document.documentElement.classList.remove('tf-theme-preview-document-v26', 'tf-theme-preview-document-v27');
      clear();
      document.removeEventListener('click', click, true);
      document.removeEventListener('submit', submit, true);
      window.removeEventListener('message', message);
    };
  }, [location.pathname, location.search]);
  return null;
}
