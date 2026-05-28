import { COSMOS_DATA, ANATOMY_DATA, HOSPITAL_DATA } from './constants';

export async function load3D(
  type: 'cosmos' | 'ana' | 'hosp',
  id: string,
  setState: (state: { iframeSrc: string | null; desc: string; loading: boolean; activeId: string | null }) => void
) {
  setState({ iframeSrc: null, desc: '', loading: true, activeId: id });

  const data = type === 'cosmos' ? COSMOS_DATA :
               type === 'ana' ? ANATOMY_DATA :
               HOSPITAL_DATA;

  const item = (data as any)[id];
  if (!item) {
    setState({ iframeSrc: null, desc: 'Module not found.', loading: false, activeId: null });
    return;
  }

  setState({
    iframeSrc: `https://sketchfab.com/models/${item.sfId}/embed?autostart=1&ui_theme=dark&transparent=1`,
    desc: item.desc,
    loading: false,
    activeId: id,
  });
}
