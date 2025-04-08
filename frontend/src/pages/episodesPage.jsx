// src/Dashboard.js
import LiveStream from '@/components/liveStream';
import UploadVideo from '@/components/uploadVideo';
import React, { useState } from 'react';
import { Container, Tab, Tabs, Card } from 'react-bootstrap';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('upload'); // Default to upload tab

  return (
    <Container fluid className="p-3">
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            id="dashboard-tabs"
            className="mb-3"
          >
            <Tab eventKey="upload" title="Upload Video">
              <div className="mt-3">
                <UploadVideo />
              </div>
            </Tab>
            <Tab eventKey="live" title="Live Stream">
              <div className="mt-3">
                <LiveStream />
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DashboardPage;