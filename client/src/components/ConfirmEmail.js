import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { UserContext } from "../context/user";

const Container = styled.div`
  max-width: 400px;
  margin: 3rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-family: 'Inter', sans-serif;
`;

const IconWrapper = styled.div`
  width: 50px;
  height: 50px;
  background: #f2e8ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const Icon = styled.img`
  width: 24px;
  height: 24px;
  filter: invert(38%) sepia(66%) saturate(750%) hue-rotate(230deg);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
`;

const Message = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
`;

const LinkText = styled.button`
  font-size: 0.9rem;
  color: #8b6fe8;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  margin-top: 0.5rem;
  
  &:hover {
    color: #6e54c9;
  }
`;

const ConfirmEmail = () => {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(true);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (user.confirmed_at) {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let interval;
    if (isSending) {
      interval = setInterval(() => {
        setTimer((prev) => {
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

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

    fetch(`${API_URL}/resend_verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
        } else {
          alert("Failed to resend verification email.");
        }
      })
      .catch(() => {
        alert("An error occurred. Please try again.");
      });
  };

  return (
    <Container>
      <IconWrapper>
        <Icon src="/email-icon.svg" alt="Email icon" />
      </IconWrapper>
      <Title>Check your email</Title>
      <Message>We've sent you a verification link to your email address.</Message>
      <Message>Didn't receive the email?</Message>
      <LinkText onClick={handleResend} disabled={isSending}>
        {isSending ? `Wait ${timer}s` : "Click to resend"}
      </LinkText>
      <br />
      <LinkText onClick={() => navigate("/login")}>Back to login</LinkText>
    </Container>
  );
};

export default ConfirmEmail;
