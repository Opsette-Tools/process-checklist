import { Layout, Typography, Switch, Space } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

interface HeaderProps {
  isDark: boolean;
  onToggleDark: (v: boolean) => void;
  leftSlot?: React.ReactNode;
}

export default function Header({ isDark, onToggleDark, leftSlot }: HeaderProps) {
  return (
    <AntHeader
      className="no-print"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: isDark ? '#141414' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
        height: 'auto',
        minHeight: 64,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <Space align="center" size={12}>
        {leftSlot}
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>Checklist</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Reusable checklists for any process</Text>
        </div>
      </Space>
      <Space align="center">
        {isDark ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />}
        <Switch checked={isDark} onChange={onToggleDark} size="small" />
      </Space>
    </AntHeader>
  );
}
