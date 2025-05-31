import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Input, Button, Avatar, Tabs, Form, message, Switch, Modal } from "antd";
import {
  EditOutlined,
  SaveOutlined,
  LogoutOutlined,
  DeleteOutlined,
  UploadOutlined,
  UserOutlined,
  SettingOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg";
import ChooseAvatar from "./ChooseAvatar";

const HeaderContainer = styled.div`
  margin-bottom: 2rem;
  text-align: left;
  text-align: center;
`;

const HeaderTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  color: #fff;
  margin: 0 0 1rem 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 1.1rem;
  color: #FAF9FA;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  animation: ${fadeIn} 0.6s ease-in-out;
  padding: 100px 20px 60px;
  background: #201925;
  min-height: 100vh;
`;

const Card = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: #2a1e30;
  border-radius: 16px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  color: #fff;
`;

const Subtitle = styled.h3`
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #ddd;
  font-weight: 500;
  text-align: left;
  font-size: 1.1rem;
`;

const AvatarWrapper = styled.div`
  cursor: pointer;
  position: relative;

  .ant-avatar {
    border: 2px solid #444;
  }

  &:hover .overlay {
    opacity: 1;
  }
`;

const OverlayIcon = styled(UploadOutlined)`
  position: absolute;
  bottom: 4px;
  right: 4px;
  color: #fff;
  opacity: 0.8;
`;

const Section = styled.div`
  margin-top: 1.5rem;
  text-align: left;
`;

const StyledLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #ddd;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    border-bottom: 1px solid #444;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    margin: 0;
    padding: 0;
  }

  .ant-tabs-nav-list {
    display: flex !important;
    width: 100%;
  }

  .ant-tabs-nav-list .ant-tabs-tab {
    flex: 1;
    text-align: center;
    background: #322338;
    border: 1px solid #444;
    border-bottom: none;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    margin: 0;
    padding: 8px;
    color: #ddd;
    position: relative;
    z-index: 1;
  }

  .ant-tabs-nav-list .ant-tabs-tab + .ant-tabs-tab {
    margin-left: -1px;
  }

  .ant-tabs-nav-list .ant-tabs-tab-active {
    background: #3d2c44;
    color: #ddd;
    border-color: #666;
    z-index: 2;
  }

  .ant-tabs-content-holder {
    background: #2a1e30;
    border: 1px solid #444;
    border-radius: 0 8px 8px 8px;
    padding: 1.25rem;
    margin-top: -1px;
  }
`;

const StyledInput = styled(Input)`
  background: #241928;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;

  &:focus,
  &:hover {
    background: #241928 !important;
    color: #fff !important;
  }

  &::placeholder {
    color: #bbb;
    opacity: 1;
  }
`;

const StyledTextArea = styled(Input.TextArea)`
  background: #241928;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;

  &:focus,
  &:hover {
    background: #241928 !important;
    color: #fff !important;
  }

  &::placeholder {
    color: #bbb;
    opacity: 1;
  }
`;

/* Custom-styled Modal to match child background and white “X” */
const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: #2a1e30;
  }
  .ant-modal-close-x svg {
    color: #fff;
  }
`;

export default function Profile() {
  const { user, setUser } = useContext(UserContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [preferences, setPreferences] = useState(user?.preferences || "");
  const [textNotifications, setTextNotifications] = useState(
    user?.text_notifications ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState(
    user?.email_notifications ?? true
  );
  const [pushNotifications, setPushNotifications] = useState(
    user?.push_notifications ?? true
  );
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  useEffect(() => {
    setNewName(user?.name || "");
    setPreferences(user?.preferences || "");
    setTextNotifications(user?.text_notifications ?? true);
    setEmailNotifications(user?.email_notifications ?? true);
    setPushNotifications(user?.push_notifications ?? true);
  }, [user]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      fetch(`${API_URL}/logout`, { method: "DELETE", credentials: "include" }).then(() => {
        setUser(null);
        navigate("/");
      });
    }
  };

  const handleSaveName = () => {
    if (!newName.trim()) {
      return message.error("Name cannot be empty.");
    }
    fetch(`${API_URL}/users/${user.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setUser(u);
        setIsEditingName(false);
        message.success("Name updated!");
      })
      .catch(() => message.error("Update failed."));
  };

  const handleCancelEdit = () => {
    setNewName(user?.name || "");
    setIsEditingName(false);
  };

  const handleSavePreferences = () => {
    fetch(`${API_URL}/users/${user.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setUser(u);
        message.success("Preferences saved!");
      })
      .catch(() => message.error("Failed to save preferences."));
  };

  const handleSaveNotifications = () => {
    fetch(`${API_URL}/users/${user.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text_notifications: textNotifications,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setUser(u);
        message.success("Notification settings updated!");
      })
      .catch(() => message.error("Failed to update notifications."));
  };

  const handleDelete = () => {
    if (!window.confirm("Delete account? This cannot be undone.")) return;
    fetch(`${API_URL}/users/${user.id}`, { method: "DELETE", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        setUser(null);
        window.location.href = "/";
      })
      .catch(() => message.error("Deletion failed."));
  };

  const tabItems = [
    {
      key: "1",
      label: (
        <span style={{ marginRight: 6, color: "#fff" }}>
          <UserOutlined style={{ marginRight: 6, color: "#fff" }} />
          Profile
        </span>
      ),
      children: (
        <>
          <Section style={{ display: "flex", alignItems: "flex-start", gap: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <AvatarWrapper onClick={() => setAvatarModalVisible(true)}>
                <Avatar size={80} src={user?.avatar || Woman} />
                <OverlayIcon className="overlay" />
              </AvatarWrapper>
              <Button
                onClick={() => setAvatarModalVisible(true)}
                size="small"
                style={{
                  marginTop: "0.75rem",
                  background: "#3d2c44",
                  border: "none",
                  color: "#fff",
                }}
              >
                Change Avatar
              </Button>
            </div>

            <div style={{ flex: 1 }}>
              {!isEditingName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.25rem", color: "#fff" }}>{user?.name}</span>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => setIsEditingName(true)}
                    style={{ border: "none", padding: 0 }}
                  />
                </div>
              ) : (
                <>
                  <StyledInput
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter new name"
                  />
                  <ButtonGroup>
                    <Button
                      icon={<SaveOutlined />}
                      size="small"
                      onClick={handleSaveName}
                      style={{ background: "#44617b", color: "#fff", border: "none" }}
                    >
                      Save
                    </Button>
                    <Button
                      icon={<CloseOutlined />}
                      size="small"
                      onClick={handleCancelEdit}
                      style={{ background: "#6b6b6b", color: "#fff", border: "none" }}
                    >
                      Cancel
                    </Button>
                  </ButtonGroup>
                </>
              )}
              <div style={{ marginTop: "1rem" }}>
                <StyledLabel>Email:</StyledLabel>
                <span style={{ color: "#fff" }}>{user?.email}</span>
              </div>
            </div>
          </Section>

          <Subtitle>Preferences</Subtitle>
          <Section>
            <Form layout="vertical">
              <Form.Item label={<StyledLabel>Allergies or Restrictions</StyledLabel>}>
                <StyledTextArea
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="e.g. Vegan, Gluten-free, None"
                  rows={3}
                />
              </Form.Item>
              <Button
                type="primary"
                style={{ background: "#CC31E8", border: "none" }}
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>
            </Form>
          </Section>
        </>
      ),
    },
    {
      key: "2",
      label: (
        <span style={{ marginRight: 6, color: "#fff" }}>
          <SettingOutlined style={{ marginRight: 6, color: "#fff" }} />
          Settings
        </span>
      ),
      children: (
        <>
          <Subtitle style={{marginTop: '0'}}>Notification Preferences</Subtitle>
          <Section>
            <Form layout="vertical">
              <Form.Item>
                <Switch
                  checked={emailNotifications}
                  onChange={(checked) => setEmailNotifications(checked)}
                />{" "}
                <span style={{ color: "#fff", marginLeft: 8 }}>Email Notifications</span>
              </Form.Item>
              <Form.Item>
                <Switch
                  checked={textNotifications}
                  onChange={(checked) => setTextNotifications(checked)}
                />{" "}
                <span style={{ color: "#fff", marginLeft: 8 }}>SMS Alerts</span>
              </Form.Item>
              <Form.Item>
                <Switch
                  checked={pushNotifications}
                  onChange={(checked) => setPushNotifications(checked)}
                />{" "}
                <span style={{ color: "#fff", marginLeft: 8 }}>Push Notifications</span>
              </Form.Item>
              <Button
                type="primary"
                style={{ background: "#CC31E8", border: "none", marginTop: "1rem" }}
                onClick={handleSaveNotifications}
              >
                Save Notification Settings
              </Button>
            </Form>
          </Section>

          <Subtitle>Account Actions</Subtitle>
          <Section>
            <ButtonGroup>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                style={{ border: "none" }}
              >
                Delete Account
              </Button>
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ background: "#6b6b6b", color: "#fff", border: "none" }}
              >
                Log Out
              </Button>
            </ButtonGroup>
          </Section>
        </>
      ),
    },
  ];

  return (
    <Container>
    <HeaderContainer>
      <HeaderTitle>Profile Settings</HeaderTitle>
      <HeaderSubtitle>Manage your personal information and preferences</HeaderSubtitle>
    </HeaderContainer>
      <Card>
        <StyledTabs
          defaultActiveKey="1"
          items={tabItems}
          animated={{ inkBar: true, tabPane: true }}
        />
      </Card>

      <StyledModal
        open={avatarModalVisible}
        footer={null}
        onCancel={() => setAvatarModalVisible(false)}
        title={null}
        closable={true}
        maskClosable={true}
        centered
      >
        <ChooseAvatar onSelect={() => setAvatarModalVisible(false)} />
      </StyledModal>
    </Container>
  );
}