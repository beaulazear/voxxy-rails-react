import React from "react";
import { Accordion } from "react-bootstrap";
import styled, { keyframes } from "styled-components";
import { NavLink } from "react-router-dom";
import VantaWrapperTwo from "./VantaWrapperTwo";

const colors = {
  background: "#0D0B1F",
  foreground: "#FFFFFF",
  muted: "#A8A8A8",
  primary: "rgba(157,96,248,1)",
  cardBackground: "rgba(27,24,49,0.95)",
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FAQContainer = styled.div`
  max-width: 1000px;
  margin: 100px auto;
  padding: 3rem;
  border-radius: 16px;
  animation: ${fadeIn} 0.8s ease-in-out;
  color: ${colors.foreground};

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
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  color: ${colors.primary};
  margin: 0;
`;

const StyledAccordion = styled(Accordion)`
  .accordion-item {
    border: none;
    margin-bottom: 14px;
    border-radius: 12px;
    background: ${colors.background};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .accordion-header {
    background: transparent;
  }

  .accordion-button {
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 600;
    background: transparent;
    color: ${colors.primary};
    padding: 1.2rem;
    border: none;
    box-shadow: none;
    transition: all 0.2s ease-in-out;

    &:hover {
      background: rgba(157, 96, 248, 0.1);
    }

    &:focus {
      box-shadow: none;
    }

    &::after {
      filter: invert(80%);
    }
  }

  .accordion-body {
    font-size: clamp(1rem, 2vw, 1.2rem);
    line-height: 1.8;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0 0 12px 12px;
    color: ${colors.muted};
    text-align: left;

    @media (max-width: 768px) {
      padding: 1.2rem;
    }
  }
`;

export const BackButton = styled(NavLink)`
  padding: 0.6rem 1.3rem;
  background: linear-gradient(135deg, #9d60f8, #6245fa);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease-in-out;

  &:hover {
    background: linear-gradient(135deg, #7d40d4, #4c2cb9);
  }

  @media (max-width: 768px) {
    font-size: 0.95rem;
    padding: 0.5rem 1rem;
    margin-top: 1rem;
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
    <VantaWrapperTwo>
      <FAQContainer>
        <HeaderContainer>
          <Title>FAQs</Title>
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
    </VantaWrapperTwo>
  );
};

export default FAQ;