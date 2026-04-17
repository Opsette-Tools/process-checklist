import { Modal, Typography } from 'antd';

const { Paragraph, Title, Text } = Typography;

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const kbdStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  padding: '1px 6px',
  border: '1px solid var(--ant-color-border, #d9d9d9)',
  borderRadius: 4,
  background: 'var(--ant-color-bg-container, #fafafa)',
};

function Kbd({ children }: { children: React.ReactNode }) {
  return <span style={kbdStyle}>{children}</span>;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="About Checklist">
      <Title level={5} style={{ marginTop: 0 }}>A business tool from Opsette Marketplace</Title>
      <Paragraph>
        Checklist helps service professionals organize multi-step processes like client onboarding, project closeout, or vendor setup.
      </Paragraph>
      <Paragraph>
        Build a template once, then spin up a fresh active checklist every time you run the same process. Track progress, link supporting docs, and copy a clean summary to share with your team.
      </Paragraph>

      <Title level={5} style={{ marginBottom: 6 }}>Keyboard shortcuts</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 13 }}>
        <div><Kbd>{mod}</Kbd> + <Kbd>N</Kbd></div>
        <div><Text type="secondary">New checklist</Text></div>
        <div><Kbd>/</Kbd></div>
        <div><Text type="secondary">Jump to "Add a step"</Text></div>
        <div><Kbd>Esc</Kbd></div>
        <div><Text type="secondary">Close drawer / exit field</Text></div>
      </div>

      <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 16 }}>
        Learn more at <a href="https://opsette.io" target="_blank" rel="noopener noreferrer">opsette.io</a>
      </Paragraph>
    </Modal>
  );
}
