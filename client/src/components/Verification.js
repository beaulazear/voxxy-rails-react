import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import colors from "../styles/Colors";
import { Heading1, MutedText } from "../styles/Typography";
import { CheckCircle } from "lucide-react";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  background-color: ${colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6rem 1rem;
  min-height: 100vh;
`;

const MessageCard = styled.div`
  background-color: ${colors.backgroundTwo};
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.8s ease-out;
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  background-color: rgba(157, 96, 248, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;

const Message = styled(MutedText)`
  font-size: 1rem;
  color: ${colors.textMuted};
`;

const Verification = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <PageContainer>
      <MessageCard>
        <IconWrapper>
          <CheckCircle size={32} color={colors.textPrimary} />
        </IconWrapper>
        <Title>Email Verified Successfully!</Title>
        <Message>
          Thank you for verifying your email. You will be redirected to the
          login page shortly.
        </Message>
      </MessageCard>
    </PageContainer>
  );
};

export default Verification;