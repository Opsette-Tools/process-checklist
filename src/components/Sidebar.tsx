import { Button, List, Typography, Tag, Empty } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Checklist } from '@/types';

const { Text } = Typography;

interface SidebarProps {
  checklists: Checklist[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function Sidebar({ checklists, selectedId, onSelect, onNew }: SidebarProps) {
  const templates = checklists.filter((c) => c.isTemplate);
  const active = checklists.filter((c) => !c.isTemplate);

  const renderGroup = (title: string, items: Checklist[], emptyText: string) => (
    <div style={{ marginBottom: 16 }}>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 12px' }}>
        {title} · {items.length}
      </Text>
      {items.length === 0 ? (
        <div style={{ padding: '8px 12px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{emptyText}</Text>
        </div>
      ) : (
        <List
          size="small"
          dataSource={items}
          renderItem={(item) => {
            const done = item.steps.filter((s) => s.completed).length;
            const total = item.steps.length;
            const isSelected = item.data_id === selectedId;
            return (
              <List.Item
                onClick={() => onSelect(item.data_id)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 6,
                  margin: '2px 6px',
                  background: isSelected ? 'rgba(169, 113, 66, 0.14)' : 'transparent',
                  border: 'none',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileTextOutlined style={{ fontSize: 12, opacity: 0.6 }} />
                    <Text strong={isSelected} ellipsis style={{ flex: 1, fontSize: 13 }}>
                      {item.name || 'Untitled'}
                    </Text>
                    {item.isTemplate && <Tag color="gold" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>TPL</Tag>}
                  </div>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 18 }}>
                    {total === 0 ? 'No steps' : `${done}/${total} steps`}
                  </Text>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} block onClick={onNew}>
          New Checklist
        </Button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {checklists.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No checklists yet" style={{ marginTop: 32 }} />
        ) : (
          <>
            {renderGroup('Templates', templates, 'No templates yet')}
            {renderGroup('Active', active, 'No active checklists')}
          </>
        )}
      </div>
    </div>
  );
}
