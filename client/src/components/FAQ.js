import React, { useState, useEffect } from "react";
import { Accordion } from "react-bootstrap";
import styled, { keyframes } from "styled-components";
import Footer from '../components/Footer';

const colors = {
  background: "#0D0B1F",
  foreground: "#FFFFFF",
  muted: "#FAF9FA",
  primary: "#B03FD9",
  cardBackground: "#2C1E33",
  accentBar: "#9D60F8",
  tabBackground: "#1B1A2E",
  lightBorder: "#333144",
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FAQContainer = styled.div`
  max-width: 1000px;
  padding: 6rem 2rem;
  padding-top: 100px;
  border-radius: 16px;
  animation: ${fadeIn} 0.8s ease-in-out;
  color: ${colors.foreground};
  margin: 0 auto;
  text-align: center;
`;

const HeaderContainer = styled.div`
  margin-bottom: 2rem;
  text-align: left;
`;

const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  color: #fff;
  margin: 0 0 1rem 0;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${colors.muted};
  max-width: 700px;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  gap: 5px;
`;

const TabButton = styled.button`
  background: #201925;
  color: ${colors.foreground};
  border: 1px solid ${colors.primary};
  padding: 0.7rem 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${({ $active }) => ($active ? 'inset 0 -3px 0 0 ' + colors.primary : 'none')};
  opacity: ${({ $active }) => ($active ? '1' : '0.7')};

  &:hover {
    opacity: 1;
  }
`;

const StyledAccordion = styled(Accordion)`
  .accordion-item {
    border: none;
    border-bottom: 1px solid ${colors.lightBorder};
    background: transparent;
  }

  .accordion-button {
    font-size: 1.1rem;
    font-weight: 600;
    background: transparent;
    color: ${colors.muted};
    padding: 1.2rem;
    border: none;
    box-shadow: none;

    &:hover {
      background: rgba(157, 96, 248, 0.05);
    }

    &::after {
      filter: invert(80%);
    }
  }

  .accordion-body {
    font-size: 1rem;
    line-height: 1.8;
    padding: 1.5rem;
    color: ${colors.muted};
    background: transparent;
    text-align: left;
  }
`;

const StepCard = styled.div`
  display: flex;
  align-items: flex-start;
  background: ${colors.cardBackground};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  margin-bottom: 1.5rem;
`;

const PurpleBar = styled.div`
  width: 6px;
  background-color: ${colors.primary};
  align-self: stretch;
`;

const StepIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${colors.primary};
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  margin-right: 1rem;
  flex-shrink: 0;
`;

const StepContentWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  gap: 1rem;
`;

const StepContent = styled.div`
  flex: 1;
  text-align: left;
`;

const StepTitle = styled.h4`
  color: ${colors.foreground};
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
`;

const StepDescription = styled.p`
  color: ${colors.muted};
  font-size: 1rem;
  margin: 0;
`;

const FAQ = () => {
  const [selectedTab, setSelectedTab] = useState("faq");

  const faqs = [
    { key: "1", question: "What is Voxxy?", answer: "Voxxy is an AI-powered platform that simplifies group decision-making and planning. Whether you're organizing a dinner, planning a trip, or coordinating any group activity, Voxxy helps everyone's preferences be heard and makes the planning process fun instead of frustrating." },
    {
      key: "2",
      question: "How do I create my first plan?",
      answer: `
        <ol style="padding-left: 1.5rem; margin: 0;">
          <li>Sign up for Voxxy.</li>
          <li>Click "Create Board" from your dashboard</li>
          <li>Select the type of event you're planning</li>
          <li>Add details like date, location, and preferences</li>
          <li>Invite your friends via email or sharing a link</li>
          <li>Let Voxxy generate recommendations based on everyone's input</li>
        </ol>
      `
    },
    {
      key: "3",
      question: "How does the AI recommendation system work?",
      answer: `
          Our AI analyzes everyone's preferences, constraints, and priorities to suggest options that maximize group satisfaction. It factors in logistics like location, budget, dietary restrictions, and previous group decisions to provide personalized recommendations.
          <br></br>
          The more you use Voxxy, the better it gets at understanding your group's unique dynamics and preferences.
      `
    },
    {
      key: "4",
      question: "Is Voxxy free to use?",
      answer: `
          Voxxy offers a free tier that allows you to create basic plans with limited features. For more advanced planning tools, customization options, and larger group capabilities, we offer premium subscription plans.
          <br></br>
          Join our email list to be the first to know about new pricing options and features as we grow!      `
    },
    {
      key: "5",
      question: "How do I invite others to my plan?",
      answer: `
        <p>After creating a plan, you'll see options to invite others through:</p>
        <ul>
        <li>Email invitations</li>
        <li>Shareable link</li>
        <li>QR code</li>
        </ul
        <p>No account is required for participants to vote or express preferences, making it easy for everyone to join in.</p>      `
    },
    {
      key: "6",
      question: "Can I integrate Voxxy with my calendar?",
      answer: `
          Yes! Voxxy integrates with popular calendar applications including Google Calendar, Apple Calendar, and Microsoft Outlook. Once your group finalizes plans, you can automatically add events to your calendar with all the relevant details included.      `
    },
  ];

  const steps = [
    { title: "Create Your Account", description: "Sign up using your email, or connect with Google or Apple for a faster setup. Complete your profile with preferences that help Voxxy make better recommendations for your groups." },
    { title: "Start a New Plan", description: "From your dashboard, click 'Create Board' and select the type of event you want to plan. Add essential details like date ranges, general location, and purpose of the gathering." },
    { title: "Invite Your Group", description: "Share your plan with friends through email invites, a shareable link, or QR code. They can join without creating accounts, making participation effortless." },
    { title: "Collect Preferences", description: "Everyone in the group can indicate their preferences, constraints, and must-haves. Voxxy provides simple polls, sliders, and selection tools to make this quick and easy." },
    { title: "Review AI Recommendations", description: "Our AI generates personalized recommendations that balance everyone's input. Browse options, view details, and see how well each matches the group's collective preferences." },
    { title: "Finalize Your Plans", description: "Vote on the final selection, confirm details, and Voxxy will help with reservations or bookings if needed. Add to your calendar with one click and get ready to enjoy your perfectly planned event!" },
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);


  return (
    <div style={{ backgroundColor: '#201925', margin: 0, padding: 0 }}>
      <FAQContainer>
        <HeaderContainer>
          <Title>How Voxxy Works</Title>
          <Subtitle>Discover how Voxxy makes group planning simple, collaborative, and fun. Find answers to common questions about using our platform.</Subtitle>
        </HeaderContainer>

        <TabContainer>
          <TabButton $active={selectedTab === "faq"} onClick={() => setSelectedTab("faq")}>FAQs</TabButton>
          <TabButton $active={selectedTab === "steps"} onClick={() => setSelectedTab("steps")}>Step-by-Step Guide</TabButton>
        </TabContainer>

        {selectedTab === "faq" ? (
          <StyledAccordion defaultActiveKey="0">
            {faqs.map(({ key, question, answer }) => (
              <Accordion.Item eventKey={key} key={key}>
                <Accordion.Header>{question}</Accordion.Header>
                <Accordion.Body dangerouslySetInnerHTML={{ __html: answer }} />
              </Accordion.Item>
            ))}
          </StyledAccordion>
        ) : (
          <>
            {steps.map((step, idx) => (
              <StepCard key={idx}>
                <PurpleBar />
                <StepContentWrapper>
                  <StepIcon>{idx + 1}</StepIcon>
                  <StepContent>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </StepContent>
                </StepContentWrapper>
              </StepCard>
            ))}
          </>
        )}
      </FAQContainer>
    <Footer />
    </div>
  );
};

export default FAQ;
