import { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme, Layout, Grid, Drawer, Button, Typography, Space, App as AntApp } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChecklistEditor from '@/components/ChecklistEditor';
import EmptyState from '@/components/EmptyState';
import AboutModal from '@/components/AboutModal';
import PrivacyModal from '@/components/PrivacyModal';
import { createChecklist, loadAll, saveAll } from '@/lib/storage';
import type { Checklist } from '@/types';

const { Sider, Content, Footer } = Layout;
const { Text } = Typography;

const DARK_KEY = 'opsette.checklist.dark';
const SELECTED_KEY = 'opsette.checklist.selected';

function AppInner() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DARK_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [checklists, setChecklists] = useState<Checklist[]>(() => loadAll());
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

  // Persist
  useEffect(() => saveAll(checklists), [checklists]);
  useEffect(() => {
    try {
      localStorage.setItem(DARK_KEY, isDark ? '1' : '0');
    } catch {}
  }, [isDark]);
  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
      else localStorage.removeItem(SELECTED_KEY);
    } catch {}
  }, [selectedId]);

  const selected = useMemo(
    () => checklists.find((c) => c.id === selectedId) ?? null,
    [checklists, selectedId]
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

  const handleDelete = () => {
    if (!selectedId) return;
    setChecklists((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  };

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
      <Header isDark={isDark} onToggleDark={setIsDark} leftSlot={headerLeft} />
      <Layout style={{ background: 'transparent' }}>
        {!isMobile && (
          <Sider
            width={260}
            theme={isDark ? 'dark' : 'light'}
            style={{
              background: isDark ? '#141414' : '#ffffff',
              borderRight: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
              height: 'calc(100vh - 64px)',
              position: 'sticky',
              top: 64,
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
              checklist={selected}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
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
              padding: '16px 24px 32px',
            }}
          >
            <Space split={<Text type="secondary">·</Text>}>
              <Button type="link" size="small" onClick={() => setAboutOpen(true)}>
                About
              </Button>
              <Button type="link" size="small" onClick={() => setPrivacyOpen(true)}>
                Privacy
              </Button>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Opsette Marketplace
              </Text>
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
  const [isDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DARK_KEY) === '1';
    } catch {
      return false;
    }
  });

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#52c41a',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <AppInner />
      </AntApp>
    </ConfigProvider>
  );
}
