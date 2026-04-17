import { Layout, Typography, Switch, Space } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

interface HeaderProps {
  isDark: boolean;
  onToggleDark: (v: boolean) => void;
  leftSlot?: React.ReactNode;
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="64" height="64" rx="12" fill="#A97142" />
      <path
        d="M18 33 L28 43 L46 22"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
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
        height: 56,
        background: isDark ? '#1E293B' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
      }}
    >
      <div style={{ width: 40, display: 'flex', alignItems: 'center' }}>{leftSlot}</div>

      <Space align="center" size={10}>
        <Logo />
        <Title
          level={4}
          style={{
            margin: 0,
            fontSize: 18,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          Checklist
        </Title>
      </Space>

      <div style={{ width: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
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
    </AntHeader>
  );
}
