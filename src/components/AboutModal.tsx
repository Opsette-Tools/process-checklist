import { Modal, Typography } from 'antd';

const { Paragraph, Title } = Typography;

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="About Checklist">
      <Title level={5} style={{ marginTop: 0 }}>A business tool from Opsette Marketplace</Title>
      <Paragraph>
        Checklist helps service professionals organize multi-step processes like client onboarding, project closeout, or vendor setup.
      </Paragraph>
      <Paragraph>
        Build a template once, then spin up a fresh active checklist every time you run the same process. Track progress, link supporting docs, and copy a clean summary to share with your team.
      </Paragraph>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Learn more at <a href="https://opsette.io" target="_blank" rel="noopener noreferrer">opsette.io</a>
      </Paragraph>
    </Modal>
  );
}
