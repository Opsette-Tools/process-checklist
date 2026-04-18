import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, theme, Layout, Grid, Drawer, Button, Space, App as AntApp, message } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChecklistEditor, { type ChecklistEditorHandle } from '@/components/ChecklistEditor';
import EmptyState from '@/components/EmptyState';
import AboutModal from '@/components/AboutModal';
import PrivacyModal from '@/components/PrivacyModal';
import { createChecklist, loadAll, saveAll } from '@/lib/storage';
import type { Checklist } from '@/types';

const { Sider, Content, Footer } = Layout;

const DARK_KEY = 'opsette.checklist.dark';
const SELECTED_KEY = 'opsette.checklist.selected';

interface AppInnerProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function AppInner({ isDark, setIsDark }: AppInnerProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('[]');
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SELECTED_KEY);
    } catch {
      return null;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const editorRef = useRef<ChecklistEditorHandle>(null);
  const [messageApi, messageContext] = message.useMessage();

  useEffect(() => {
    let cancelled = false;
    loadAll().then((lists) => {
      if (!cancelled) {
        setChecklists(lists);
        setLastSavedSnapshot(JSON.stringify(lists));
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDirty = useMemo(() => {
    if (!loaded || !selectedId) return false;
    const current = checklists.find((c) => c.id === selectedId);
    if (!current) return false;
    let saved: Checklist[] = [];
    try {
      saved = JSON.parse(lastSavedSnapshot) as Checklist[];
    } catch {
      return true;
    }
    const savedItem = saved.find((c) => c.id === selectedId);
    if (!savedItem) return true;
    return JSON.stringify(current) !== JSON.stringify(savedItem);
  }, [checklists, selectedId, lastSavedSnapshot, loaded]);

  const handleSave = async () => {
    await saveAll(checklists);
    setLastSavedSnapshot(JSON.stringify(checklists));
    messageApi.success('Saved');
  };

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
      else localStorage.removeItem(SELECTED_KEY);
    } catch {}
  }, [selectedId]);

  const selected = useMemo(
    () => checklists.find((c) => c.id === selectedId) ?? null,
    [checklists, selectedId],
  );

  const handleNew = () => {
    const c = createChecklist({ name: 'Untitled Checklist' });
    setChecklists((prev) => [c, ...prev]);
    setSelectedId(c.id);
    if (isMobile) setDrawerOpen(false);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (isMobile) setDrawerOpen(false);
  };

  const handleUpdate = (next: Checklist) => {
    setChecklists((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  const handleCreate = (c: Checklist) => {
    setChecklists((prev) => [c, ...prev]);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const removed = checklists.find((c) => c.id === selectedId);
    if (!removed) return;
    const removedIndex = checklists.findIndex((c) => c.id === selectedId);
    setChecklists((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);

    messageApi.open({
      key: `undo-checklist-${removed.id}`,
      type: 'info',
      duration: 6,
      content: (
        <span>
          "{removed.name}" deleted.{' '}
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => {
              setChecklists((prev) => {
                const next = [...prev];
                const insertAt = Math.min(removedIndex, next.length);
                next.splice(insertAt, 0, removed);
                return next;
              });
              setSelectedId(removed.id);
              messageApi.destroy(`undo-checklist-${removed.id}`);
            }}
          >
            Undo
          </Button>
        </span>
      ),
    });
  };

  // Keyboard shortcuts: Cmd/Ctrl+N new, "/" focus add-step, Esc close drawer/modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNew();
        return;
      }

      if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        editorRef.current?.focusAddStep();
        return;
      }

      if (e.key === 'Escape') {
        if (drawerOpen) setDrawerOpen(false);
        else if (aboutOpen) setAboutOpen(false);
        else if (privacyOpen) setPrivacyOpen(false);
        else if (isTypingTarget(e.target)) (e.target as HTMLElement).blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerOpen, aboutOpen, privacyOpen]);

  const sidebar = (
    <Sidebar
      checklists={checklists}
      selectedId={selectedId}
      onSelect={handleSelect}
      onNew={handleNew}
    />
  );

  const headerLeft = isMobile ? (
    <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
  ) : null;

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#000' : '#f5f5f5' }}>
      {messageContext}
      <Header isDark={isDark} onToggleDark={setIsDark} leftSlot={headerLeft} />
      <Layout style={{ background: 'transparent' }}>
        {!isMobile && (
          <Sider
            width={260}
            theme={isDark ? 'dark' : 'light'}
            style={{
              background: isDark ? '#141414' : '#ffffff',
              borderRight: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
              height: 'calc(100vh - 60px)',
              position: 'sticky',
              top: 60,
              overflow: 'hidden',
            }}
          >
            {sidebar}
          </Sider>
        )}
        {isMobile && (
          <Drawer
            placement="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width={280}
            styles={{ body: { padding: 0 } }}
            title="Checklists"
          >
            {sidebar}
          </Drawer>
        )}
        <Content style={{ background: isDark ? '#000' : '#f5f5f5' }}>
          {selected ? (
            <ChecklistEditor
              ref={editorRef}
              checklist={selected}
              onUpdate={handleUpdate}
              onDelete={handleDeleteSelected}
              onCreate={handleCreate}
              onSwitchTo={setSelectedId}
              onSave={handleSave}
              dirty={selectedDirty}
              isDark={isDark}
            />
          ) : (
            <EmptyState onNew={handleNew} />
          )}
          <Footer
            className="no-print"
            style={{
              textAlign: 'center',
              background: 'transparent',
              padding: '16px 20px',
              fontSize: 13,
              color: isDark ? '#64748B' : '#94A3B8',
            }}
          >
            <Space split={<span style={{ color: isDark ? '#475569' : '#CBD5E1' }}>&middot;</span>}>
              <button
                onClick={() => setAboutOpen(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontSize: 'inherit', padding: 0,
                }}
              >
                About
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontSize: 'inherit', padding: 0,
                }}
              >
                Privacy
              </button>
              <span>
                By{' '}
                <a
                  href="https://opsette.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Opsette
                </a>
              </span>
            </Space>
          </Footer>
        </Content>
      </Layout>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </Layout>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DARK_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DARK_KEY, isDark ? '1' : '0');
    } catch {}
  }, [isDark]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#A97142',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <AppInner isDark={isDark} setIsDark={setIsDark} />
      </AntApp>
    </ConfigProvider>
  );
}
