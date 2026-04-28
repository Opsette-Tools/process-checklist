import { Modal, Typography } from 'antd';
import { OpsetteFooterLogo } from '@/components/opsette-share';

const { Paragraph, Title } = Typography;

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Privacy">
      <Title level={5} style={{ marginTop: 0 }}>Your data stays on your device</Title>
      <Paragraph>
        All checklists and steps are stored locally in your browser via <code>localStorage</code>. Nothing is sent to a server.
      </Paragraph>
      <Paragraph>
        No cookies, no tracking, no analytics, no account required.
      </Paragraph>
      <OpsetteFooterLogo />
    </Modal>
  );
}
