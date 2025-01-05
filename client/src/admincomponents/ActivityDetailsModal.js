import React from 'react';
import { Modal, Button } from 'antd';
import styled from 'styled-components';

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;

  h3 {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
  }

  p {
    font-size: 1rem;
    color: #555;
    margin: 0.2rem 0;
  }

  .group-info {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.5rem;

    span {
      background: #e942f5;
      color: #fff;
      padding: 0.3rem 0.6rem;
      border-radius: 50%;
    }
  }
`;

function ActivityDetailsModal({ activity, isVisible, onClose }) {
    if (!activity) return null;

    return (
        <Modal
            title={'Trip Name: ' + activity.activity_name || 'Activity Details'}
            open={isVisible} // ✅ Replaced 'visible' with 'open'
            onCancel={onClose}
            footer={[
                <Button key="archive">Archive</Button>,
                <Button key="save" type="primary">
                    Save
                </Button>,
            ]}
        >
            <ModalContent>
                <h3>Activity Type: {activity.activity_type || 'Not specified'}</h3>
                <p>
                    <strong>Location:</strong> {activity.activity_location || 'Not specified'}
                </p>
                <p>
                    <strong>Group Size:</strong> {activity.group_size || 'N/A'}
                </p>
                <p>
                    <strong>Date Notes:</strong> {activity.date_notes || 'No notes provided'}
                </p>
                <p>
                    <strong>Created At:</strong> {new Date(activity.created_at).toLocaleDateString()}
                </p>
                <div className="group-info">
                    <span>👤</span>
                    <span>👤</span>
                    <span>👤</span>
                    <span>➕</span>
                </div>
            </ModalContent>
        </Modal>
    );
}

export default ActivityDetailsModal;