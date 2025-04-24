import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import colors from "../styles/Colors";
import { Heading1, MutedText } from "../styles/Typography";
import { UserContext } from "../context/user";
import { Mail } from "lucide-react";

const PageContainer = styled.div`
  background-color: ${colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6rem 1rem;
  min-height: 100vh;
`;

const FormContainer = styled.div`
  background-color: ${colors.backgroundTwo};
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
  margin-bottom: 0.75rem;
  color: ${colors.textMuted};
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: ${colors.textPrimary};
  font-size: 0.95rem;
  margin: 0.4rem 0;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover:not(:disabled) {
    color: ${colors.textPrimary};
  }

  &:disabled {
    color: ${colors.textMuted};
    cursor: not-allowed;
  }
`;

const ConfirmEmail = () => {
  const { user, loading, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(true);
  const [timer, setTimer] = useState(60);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/login");
      else if (user.confirmed_at) navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let interval;
    if (isSending) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsSending(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSending]);

  const handleResend = () => {
    if (isSending) return;
    setIsSending(true);
    setTimer(60);

    fetch(`${API_URL}/resend_verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then(res => res.json())
      .then(data => alert(data.message || "Failed to resend verification email."))
      .catch(() => alert("An error occurred. Please try again."));
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    fetch(`${API_URL}/logout`, {
      method: "DELETE",
      credentials: "include",
    }).then(() => {
      setUser(null);
      navigate("/");
    });
  };

  return (
    <PageContainer>
      <FormContainer>
        <IconWrapper>
          <Mail size={32} color={colors.textPrimary} />
        </IconWrapper>
        <Title>Check your email</Title>
        <Message>We've sent you a verification link to your email address.</Message>
        <Message>Didn't receive the email?</Message>
        <LinkButton onClick={handleResend} disabled={isSending}>
          {isSending ? `Wait ${timer}s` : "Resend verification"}
        </LinkButton>
        <LinkButton onClick={() => navigate("/login")}>
          Back to login
        </LinkButton>
        <LinkButton onClick={handleLogout}>
          Log out
        </LinkButton>
      </FormContainer>
    </PageContainer>
  );
};

export default ConfirmEmail;