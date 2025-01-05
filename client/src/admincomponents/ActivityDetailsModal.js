import React, { useContext } from 'react';
import { Modal, Button, Switch, Collapse, message } from 'antd';
import styled from 'styled-components';
import { UserContext } from '../context/user';

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  h2 {
    font-size: 1.4rem;
    font-weight: bold;
    margin: 0;
    white-space: nowrap;
  }
`;

const ModalSubHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;

  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }

  .status-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;

    span {
      font-size: 0.9rem;
      color: #555;
    }
  }
`;

const GroupInfo = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;

  span {
    background: #e942f5;
    color: #fff;
    padding: 0.3rem 0.6rem;
    border-radius: 50%;
  }
`;

const StyledCollapse = styled(Collapse)`
  .ant-collapse-header {
    font-weight: 600;
  }
`;

const FooterButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;

  button {
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

function ActivityDetailsModal({ activity, isVisible, onClose }) {
    const { user, setUser } = useContext(UserContext);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    if (!activity) return null;

    const handleDelete = async () => {
        try {
            const response = await fetch(`${API_URL}/activities/${activity.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to delete activity');
            }

            setUser((prevUser) => ({
                ...prevUser,
                activities: prevUser.activities.filter((act) => act.id !== activity.id),
            }));

            message.success('Activity deleted successfully');
            onClose();
        } catch (error) {
            console.error('Error deleting activity:', error);
            message.error('Failed to delete activity');
        }
    };

    const confirmDelete = () => {
        Modal.confirm({
            title: 'Are you sure you want to delete this activity?',
            content: 'This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: handleDelete,
        });
    };

    const collapseItems = [
        {
            key: '1',
            label: 'Details',
            children: (
                <>
                    <p><strong>Activity Type:</strong> {activity.activity_type || 'Not specified'}</p>
                    <p><strong>Location:</strong> {activity.activity_location || 'Not specified'}</p>
                    <p><strong>Group Size:</strong> {activity.group_size || 'N/A'}</p>
                    <p><strong>Date Notes:</strong> {activity.date_notes || 'No notes provided'}</p>
                    <p><strong>Created At:</strong> {new Date(activity.created_at).toLocaleDateString()}</p>
                </>
            ),
        },
        {
            key: '2',
            label: 'Recommendation Summary',
            children: <p>Placeholder for recommendation summary...</p>,
        },
        {
            key: '3',
            label: 'Tasks',
            children: <p>Placeholder for tasks...</p>,
        },
        {
            key: '4',
            label: 'Personal Board',
            children: <p>Placeholder for personal board...</p>,
        },
    ];

    return (
        <Modal
            title={
                <ModalHeader>
                    <h2>{activity.activity_name || 'Activity Details'}</h2>
                </ModalHeader>
            }
            open={isVisible}
            onCancel={onClose}
            footer={[
                <FooterButtons key="footer">
                    <Button key="delete" danger onClick={confirmDelete}>
                        Delete
                    </Button>
                    <Button key="save" type="primary">
                        Save
                    </Button>
                </FooterButtons>,
            ]}
        >
            <ModalSubHeader>
                <p><strong>Host:</strong> Courtney Greer</p>
                <div className="status-toggle">
                    <span><strong>Status:</strong></span>
                    <Switch defaultChecked />
                </div>
            </ModalSubHeader>
            <GroupInfo>
                <span>👤</span>
                <span>👤</span>
                <span>👤</span>
                <span>➕</span>
            </GroupInfo>
            <StyledCollapse items={collapseItems} defaultActiveKey={['1']} />
        </Modal>
    );
}

export default ActivityDetailsModal;