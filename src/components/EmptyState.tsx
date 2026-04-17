import { Empty, Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface EmptyStateProps {
  onNew: () => void;
}

export default function EmptyState({ onNew }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
        <Title level={4} style={{ marginTop: 16 }}>No checklist selected</Title>
        <Paragraph type="secondary">
          Create a new checklist or pick one from the list to get started. Build templates for processes you repeat — like onboarding, project closeout, or vendor setup.
        </Paragraph>
        <Button type="primary" icon={<PlusOutlined />} onClick={onNew}>
          New Checklist
        </Button>
      </div>
    </div>
  );
}
