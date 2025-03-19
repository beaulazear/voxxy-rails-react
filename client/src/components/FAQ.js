import React from "react";
import { Accordion } from "react-bootstrap";
import styled, { keyframes } from "styled-components";
import { NavLink } from "react-router-dom";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FAQContainer = styled.div`
  max-width: 1000px;
  margin: 100px auto;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  text-align: left;
  animation: ${fadeIn} 0.8s ease-in-out;

  @media (max-width: 1024px) {
    padding: 2.5rem;
    max-width: 90%;
  }

  @media (max-width: 768px) {
    padding: 1.8rem;
    margin: 50px auto;
    max-width: 95%;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.8rem;
`;

const Title = styled.h2`
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 800;
  color: #4e0f63;
  margin: 0;
`;

const StyledAccordion = styled(Accordion)`
  .accordion-item {
    border: none;
    margin-bottom: 12px;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .accordion-header {
    background: white;
  }

  .accordion-button {
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 700;
    color: #6a1b9a;
    background: white;
    padding: 1.2rem;
    border: none;
    box-shadow: none;
    transition: all 0.2s ease-in-out;

    &:hover {
      background: rgba(106, 27, 154, 0.05);
    }

    &:focus {
      box-shadow: none;
    }
  }

  .accordion-body {
    font-size: clamp(1rem, 2vw, 1.2rem);
    line-height: 1.8;
    padding: 1.5rem;
    background: #f9f9f9;
    border-radius: 8px;
    color: #333;

    @media (max-width: 768px) {
      padding: 1.2rem;
    }
  }
`;

export const BackButton = styled(NavLink)`
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.3s ease-in-out;

  &:hover {
    background: linear-gradient(135deg, #4e0f63, #6a1b8a);
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.5rem 1rem;
  }
`;

const FAQ = () => {
  const faqs = [
    {
      key: "1",
      question: "How do I start an activity on Voxxy?",
      answer:
        "Starting an activity on Voxxy is simple! Click on 'Create Board', choose your event type, and set up the details. Invite friends via email, and once they join, you're all set to start planning together!",
    },
    {
      key: "2",
      question: "How do I invite others to my activity?",
      answer:
        "You can invite participants by entering their email addresses while creating an activity board. They'll receive an email with a direct link to join the activity and start collaborating instantly.",
    },
    {
      key: "3",
      question: "What happens when someone accepts my invitation?",
      answer:
        "Once a participant clicks the invite link and signs up, they will automatically be added to your activity board. You'll see their name and profile on the board, and they can contribute to the planning process.",
    },
    {
      key: "4",
      question: "What is Chat with Voxxy?",
      answer:
        "Chat with Voxxy is an interactive feature that helps refine your event. You can answer questions about your preferences, and Voxxy will suggest the best locations, times, and recommendations based on your responses.",
    },
    {
      key: "5",
      question: "Can I use Voxxy on my phone?",
      answer:
        "Yes! Voxxy is fully responsive, making it easy to use on mobile devices. You can also add it to your home screen for quick access, giving you an app-like experience right from your phone's browser.",
    },
    {
      key: "6",
      question: "Is Voxxy available as a mobile app?",
      answer:
        "Currently, Voxxy is a web-based platform, but a mobile app version is in the works! Stay tuned for updates as we continue improving the experience for mobile users.",
    },
  ];

  return (
    <FAQContainer>
      <HeaderContainer>
        <Title>FAQ's</Title>
        <BackButton to="/">Home</BackButton>
      </HeaderContainer>

      <StyledAccordion defaultActiveKey="0">
        {faqs.map(({ key, question, answer }) => (
          <Accordion.Item eventKey={key} key={key}>
            <Accordion.Header>{question}</Accordion.Header>
            <Accordion.Body>{answer}</Accordion.Body>
          </Accordion.Item>
        ))}
      </StyledAccordion>
    </FAQContainer>
  );
};

export default FAQ;