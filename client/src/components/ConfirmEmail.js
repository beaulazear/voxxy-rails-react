import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button, message, Spin } from "antd";
import { UserContext } from "../context/user";

const ConfirmSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 60vh;
  background: linear-gradient(to right, #7F31D9 0%, #431A73 100%);
  color: white;
  padding: 20px;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  line-height: 1.2;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Message = styled.p`
  font-size: 1.2rem;
  margin-bottom: 30px;
  max-width: 600px;
  line-height: 1.6;
  font-family: 'Montserrat', sans-serif;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StyledButton = styled(Button)`
  background-color: white;
  border: none;
  font-size: 1rem;
  padding: 0.75rem 2rem;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #fbe9e7;
    color: #bf360c;
  }
`;

const ConfirmEmail = () => {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login"); // Redirect unauthenticated users to login
      } else if (user.confirmed_at) {
        navigate("/"); // Redirect confirmed users to homepage
      }
    }
  }, [user, loading, navigate]);

  const handleResend = () => {
    setIsSending(true);

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

    fetch(`${API_URL}/resend_verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          message.success(data.message);
        } else {
          message.error(data.error || "Failed to resend verification email.");
        }
      })
      .catch(() => {
        message.error("An error occurred. Please try again.");
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfirmSection>
      <Title>Email Not Verified</Title>
      <Message>
        Please check your email and verify your account to access this section. If you haven't received an email, click the button below to resend it.
      </Message>
      <StyledButton onClick={handleResend} disabled={isSending}>
        {isSending ? "Sending..." : "Resend Verification Email"}
      </StyledButton>
    </ConfirmSection>
  );
};

export default ConfirmEmail;