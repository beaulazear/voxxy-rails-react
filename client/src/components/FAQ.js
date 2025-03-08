import React, { useState } from "react";
import styled from "styled-components";
import { Collapse } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";

const FAQContainer = styled.div`
  max-width: 900px;
  margin: 80px auto;
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  text-align: left;

  @media (max-width: 768px) {
    padding: 1.8rem;
    margin: 50px auto;
  }
`;

const Title = styled.h2`
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  margin-top: 0;
`;

const StyledCollapse = styled(Collapse)`
  border-radius: 8px;
  border: none;
  background: white;

  .ant-collapse-item {
    border-bottom: 1px solid #e0e0e0;
  }

  .ant-collapse-header {
    font-size: 1.2rem;
    font-weight: 600;
    color: #4e0f63;
    padding: 1.2rem;
    &:hover {
      background: rgba(78, 15, 99, 0.05);
    }
  }

  .ant-collapse-content {
    font-size: 1rem;
    padding: 1rem;
    line-height: 1.6;
  }
`;

const FAQ = () => {
    const faqs = [
        {
            key: "1",
            label: "How do I start an activity on Voxxy?",
            children: "Create a new board, invite participants by email, and start planning!",
        },
        {
            key: "2",
            label: "How do I invite others to my activity?",
            children: "When you create a board, you can send invitations via email. Invited users will receive a link to join your activity.",
        },
        {
            key: "3",
            label: "What happens when someone accepts my invitation?",
            children: "Once they sign up and accept the invitation, they will be listed as a confirmed participant on your activity board.",
        },
        {
            key: "4",
            label: "What is Chat with Voxxy?",
            children: "Chat with Voxxy lets you submit preferences for your activity. Voxxy will generate personalized recommendations based on your inputs.",
        },
        {
            key: "5",
            label: "Can I use Voxxy on my phone?",
            children: "Yes! While we are currently a web app, you can add Voxxy to your phone's home screen and use it like a mobile app for a better experience.",
        },
        {
            key: "6",
            label: "Is Voxxy available as a mobile app?",
            children: "Not yet, but a mobile version is coming soon! Stay tuned for updates.",
        },
    ];

    return (
        <FAQContainer>
            <Title>FAQ's</Title>
            <StyledCollapse
                accordion={false} // Allows multiple panels to open
                expandIcon={({ isActive }) => (isActive ? <MinusOutlined /> : <PlusOutlined />)}
                items={faqs} // Uses the correct Ant Design syntax
            />
        </FAQContainer>
    );
};

export default FAQ;