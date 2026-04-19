import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, theme, Layout, Grid, Drawer, Button, Space, App as AntApp, message } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChecklistEditor, { type ChecklistEditorHandle } from '@/components/ChecklistEditor';
import EmptyState from '@/components/EmptyState';
import AboutModal from '@/components/AboutModal';
import PrivacyModal from '@/components/PrivacyModal';
import { clearLocalData, createChecklist, defaultPresets, loadAll, saveAll } from '@/lib/storage';
import type { Bridge } from '@/lib/bridge';
import type { Checklist, Presets } from '@/types';

const { Sider, Content, Footer } = Layout;

const DARK_KEY = 'opsette.checklist.dark';
const SELECTED_KEY = 'opsette.checklist.selected';

interface AppInnerProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  bridge: Bridge | null;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function AppInner({ isDark, setIsDark, bridge }: AppInnerProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [presets, setPresets] = useState<Presets>(() => defaultPresets());
  const [loaded, setLoaded] = useState(false);
  const [lastSavedChecklists, setLastSavedChecklists] = useState<string>('[]');
  const [lastSavedPresets, setLastSavedPresets] = useState<string>('{}');
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

    // Bridge-active: take parent's init as the source of truth; skip local migration
    // entirely per parent-side guidance (avoids duplicate rows if both have data).
    if (bridge) {
      const unsubscribeTimeout = bridge.onTimeout(() => {
        messageApi.error('Couldn\'t save to Opsette. Try again in a moment.');
      });
      const lists = bridge.init.items.map((i) => i.value);
      const loadedPresets: Presets =
        bridge.init.presets && Array.isArray(bridge.init.presets.categories) && bridge.init.presets.categories.length > 0
          ? bridge.init.presets
          : defaultPresets();
      setChecklists(lists);
      setPresets(loadedPresets);
      setLastSavedChecklists(JSON.stringify(lists));
      setLastSavedPresets(JSON.stringify(loadedPresets));
      setLoaded(true);

      // State is hydrated from the bridge → any legacy localStorage data is stale
      // zombies from a previous standalone session. Wipe the data-bearing keys now
      // so a future handshake failure can't surface them. UI prefs (dark/selected)
      // are left alone.
      clearLocalData();

      return () => {
        unsubscribeTimeout();
      };
    }

    // Standalone: localStorage path, with legacy shape migration on read.
    loadAll().then(({ checklists: lists, presets: loadedPresets }) => {
      if (!cancelled) {
        setChecklists(lists);
        setPresets(loadedPresets);
        setLastSavedChecklists(JSON.stringify(lists));
        setLastSavedPresets(JSON.stringify(loadedPresets));
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bridge, messageApi]);

  const selectedDirty = useMemo(() => {
    if (!loaded || !selectedId) return false;
    const current = checklists.find((c) => c.data_id === selectedId);
    if (!current) return false;
    let saved: Checklist[] = [];
    try {
      saved = JSON.parse(lastSavedChecklists) as Checklist[];
    } catch {
      return true;
    }
    const savedItem = saved.find((c) => c.data_id === selectedId);
    if (!savedItem) return true;
    return JSON.stringify(current) !== JSON.stringify(savedItem);
  }, [checklists, selectedId, lastSavedChecklists, loaded]);

  const presetsDirty = useMemo(() => {
    if (!loaded) return false;
    return JSON.stringify(presets) !== lastSavedPresets;
  }, [presets, lastSavedPresets, loaded]);

  const dirty = selectedDirty || presetsDirty;

  const handleSave = async () => {
    if (bridge) {
      // Figure out which checklists changed since last save.
      let savedChecklists: Checklist[] = [];
      try {
        savedChecklists = JSON.parse(lastSavedChecklists) as Checklist[];
      } catch {
        // treat everything as dirty
      }
      const savedById = new Map(savedChecklists.map((c) => [c.data_id, c]));
      const dirtyChecklists = checklists.filter((c) => {
        const prev = savedById.get(c.data_id);
        return !prev || JSON.stringify(prev) !== JSON.stringify(c);
      });
      const needsPresets = JSON.stringify(presets) !== lastSavedPresets;

      const ops: Array<Promise<unknown>> = [];
      for (const c of dirtyChecklists) ops.push(bridge.save(c.data_id, c));
      if (needsPresets) ops.push(bridge.savePresets(presets));

      try {
        await Promise.all(ops);
        setLastSavedChecklists(JSON.stringify(checklists));
        setLastSavedPresets(JSON.stringify(presets));
        messageApi.success('Saved');
      } catch (err) {
        // The bridge's onTimeout handler already fired a toast for timeouts;
        // for protocol-level errors, surface the message here too.
        const errMsg = err instanceof Error ? err.message : 'Save failed';
        if (!errMsg.includes('timed out')) messageApi.error(errMsg);
      }
      return;
    }

    // Standalone
    await saveAll(checklists, presets);
    setLastSavedChecklists(JSON.stringify(checklists));
    setLastSavedPresets(JSON.stringify(presets));
    messageApi.success('Saved');
  };

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
      else localStorage.removeItem(SELECTED_KEY);
    } catch {}
  }, [selectedId]);

  const selected = useMemo(
    () => checklists.find((c) => c.data_id === selectedId) ?? null,
    [checklists, selectedId],
  );

  const handleNew = () => {
    const c = createChecklist({ name: 'Untitled Checklist' });
    setChecklists((prev) => [c, ...prev]);
    setSelectedId(c.data_id);
    if (isMobile) setDrawerOpen(false);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (isMobile) setDrawerOpen(false);
  };

  const handleUpdate = (next: Checklist) => {
    setChecklists((prev) => prev.map((c) => (c.data_id === next.data_id ? next : c)));
  };

  const handleCreate = (c: Checklist) => {
    setChecklists((prev) => [c, ...prev]);
  };

  /**
   * Create + persist a template in one shot. Used by "Save as Template" so the
   * button actually saves when clicked (matching its label).
   *
   * Behavior:
   *  - Adds `template` to state and switches the selection to it.
   *  - If `sourceId` refers to a checklist that was never saved (not present in
   *    the last-saved snapshot), removes it from state so the sidebar doesn't
   *    hold an orphan source checklist next to the new template.
   *  - Persists the new template: bridge.save when bridged, saveAll for standalone.
   *  - Surfaces an error toast if the bridge save fails; the template stays in
   *    state so the user can retry with the normal Save button.
   */
  const handleCreateAndPersistTemplate = async (template: Checklist, sourceId: string) => {
    const savedIds = (() => {
      try {
        return new Set((JSON.parse(lastSavedChecklists) as Checklist[]).map((c) => c.data_id));
      } catch {
        return new Set<string>();
      }
    })();
    const shouldDiscardSource = !savedIds.has(sourceId);

    const nextChecklists = [
      template,
      ...checklists.filter((c) => !(shouldDiscardSource && c.data_id === sourceId)),
    ];

    setChecklists(nextChecklists);
    setSelectedId(template.data_id);

    if (bridge) {
      try {
        await bridge.save(template.data_id, template);
        // Update last-saved to include the new template so it's not marked dirty.
        // Keep other entries as they were (source's dirty status is preserved if it
        // wasn't discarded).
        setLastSavedChecklists((prev) => {
          let saved: Checklist[] = [];
          try { saved = JSON.parse(prev) as Checklist[]; } catch {}
          // Drop any stale entry for the (now-discarded) source.
          if (shouldDiscardSource) saved = saved.filter((c) => c.data_id !== sourceId);
          saved = [template, ...saved.filter((c) => c.data_id !== template.data_id)];
          return JSON.stringify(saved);
        });
        messageApi.success('Template saved');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Couldn\'t save template';
        if (!errMsg.includes('timed out')) messageApi.error(errMsg);
      }
      return;
    }

    // Standalone: write the whole updated array to localStorage.
    await saveAll(nextChecklists, presets);
    setLastSavedChecklists(JSON.stringify(nextChecklists));
    messageApi.success('Template saved');
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const removed = checklists.find((c) => c.data_id === selectedId);
    if (!removed) return;
    const removedIndex = checklists.findIndex((c) => c.data_id === selectedId);
    setChecklists((prev) => prev.filter((c) => c.data_id !== selectedId));
    setSelectedId(null);

    // Bridge: fire delete immediately. If the user undoes, the subsequent Save
    // re-upserts the checklist with the same data_id, which parent treats as an
    // insert. Net effect: delete-then-resave is idempotent. No coordination needed.
    if (bridge) {
      bridge.delete(removed.data_id).catch(() => {
        // Timeout handler already toasted; nothing else to do on the UI.
      });
    } else {
      // Standalone: removal will be persisted on the next Save click via saveAll.
    }

    messageApi.open({
      key: `undo-checklist-${removed.data_id}`,
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
              setSelectedId(removed.data_id);
              messageApi.destroy(`undo-checklist-${removed.data_id}`);
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
              checklists={checklists}
              presets={presets}
              onUpdatePresets={setPresets}
              onUpdate={handleUpdate}
              onDelete={handleDeleteSelected}
              onCreate={handleCreate}
              onCreateAndPersistTemplate={handleCreateAndPersistTemplate}
              onSwitchTo={setSelectedId}
              onSave={handleSave}
              dirty={dirty}
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

interface AppProps {
  bridge?: Bridge | null;
}

export default function App({ bridge = null }: AppProps) {
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
        <AppInner isDark={isDark} setIsDark={setIsDark} bridge={bridge} />
      </AntApp>
    </ConfigProvider>
  );
}
