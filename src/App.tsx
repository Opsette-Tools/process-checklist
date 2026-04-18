import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ConfigProvider, theme, Layout, Grid, Drawer, Button, Space, App as AntApp, message } from 'antd';
import { MenuOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
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

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

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
  const [dirty, setDirty] = useState(false);
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

  // --- Data loading ---
  useEffect(() => {
    if (isInIframe) {
      const handler = (event: MessageEvent) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object' || msg.type !== 'opsette:data') return;

        if (Array.isArray(msg.value)) {
          setChecklists(msg.value as Checklist[]);
        } else {
          setChecklists([]);
        }
        setLoaded(true);
        setDirty(false);
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    } else {
      let cancelled = false;
      loadAll().then((lists) => {
        if (!cancelled) {
          setChecklists(lists);
          setLoaded(true);
        }
      });
      return () => { cancelled = true; };
    }
  }, []);

  // --- Data saving ---
  // Standalone: auto-save to localStorage
  // Iframe: only save when user clicks Save button
  useEffect(() => {
    if (!loaded || isInIframe) return;
    saveAll(checklists);
  }, [checklists, loaded]);

  // Mark dirty when checklists change (only matters in iframe)
  const updateChecklists = useCallback((updater: (prev: Checklist[]) => Checklist[]) => {
    setChecklists((prev) => {
      const next = updater(prev);
      if (isInIframe && loaded) setDirty(true);
      return next;
    });
  }, [loaded]);

  const handleSave = useCallback(() => {
    if (!isInIframe) return;
    window.parent.postMessage({ type: 'opsette:save', value: checklists }, '*');
    setDirty(false);
    messageApi.success('Saved');
  }, [checklists, messageApi]);

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
    updateChecklists((prev) => [c, ...prev]);
    setSelectedId(c.id);
    if (isMobile) setDrawerOpen(false);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (isMobile) setDrawerOpen(false);
  };

  const handleUpdate = (next: Checklist) => {
    updateChecklists((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  const handleCreate = (c: Checklist) => {
    updateChecklists((prev) => [c, ...prev]);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const removed = checklists.find((c) => c.id === selectedId);
    if (!removed) return;
    const removedIndex = checklists.findIndex((c) => c.id === selectedId);
    updateChecklists((prev) => prev.filter((c) => c.id !== selectedId));
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
              updateChecklists((prev) => {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNew();
        return;
      }

      // Cmd/Ctrl+S to save (iframe only)
      if (mod && (e.key === 's' || e.key === 'S') && isInIframe) {
        e.preventDefault();
        handleSave();
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
  }, [drawerOpen, aboutOpen, privacyOpen, handleSave]);

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

  const saveButton = isInIframe ? (
    <Button
      type={dirty ? 'primary' : 'default'}
      size="small"
      icon={dirty ? <SaveOutlined /> : <CheckCircleOutlined />}
      onClick={handleSave}
      disabled={!dirty}
    >
      {dirty ? 'Save' : 'Saved'}
    </Button>
  ) : null;

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#000' : '#f5f5f5' }}>
      {messageContext}
      <Header isDark={isDark} onToggleDark={setIsDark} leftSlot={headerLeft} rightSlot={saveButton} />
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
