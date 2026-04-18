import { Layout, Typography, Switch, Space } from 'antd';
import { SunOutlined, MoonOutlined, ScheduleOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

interface HeaderProps {
  isDark: boolean;
  onToggleDark: (v: boolean) => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export default function Header({ isDark, onToggleDark, leftSlot, rightSlot }: HeaderProps) {
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
        padding: '0 20px',
        height: 60,
        background: isDark ? '#141414' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#303030' : '#EAEAEA'}`,
      }}
    >
      <div style={{ width: 80, display: 'flex', alignItems: 'center' }}>{leftSlot}</div>

      <Space align="center" size={10}>
        <ScheduleOutlined style={{ fontSize: 22, color: '#A97142' }} />
        <Title
          level={3}
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Process Checklist
        </Title>
      </Space>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {rightSlot}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SunOutlined
            style={{
              opacity: isDark ? 0.4 : 1,
              fontSize: 13,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          />
          <Switch checked={isDark} onChange={onToggleDark} size="small" />
          <MoonOutlined
            style={{
              opacity: isDark ? 1 : 0.4,
              fontSize: 13,
              color: isDark ? '#E4C49A' : '#94A3B8',
            }}
          />
        </div>
      </div>
    </AntHeader>
  );
}
