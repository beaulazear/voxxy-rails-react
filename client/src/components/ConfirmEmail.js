import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Modal } from "antd";
import colors from "../styles/Colors";
import { Heading1, MutedText } from "../styles/Typography";
import { UserContext } from "../context/user";
import { Mail, Shield } from "lucide-react";

const PageContainer = styled.div`
  background: ${colors.background};
  background-image: 
    radial-gradient(circle at 30% 20%, rgba(157, 96, 248, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(204, 49, 232, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 20% 70%, rgba(89, 37, 102, 0.03) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  min-height: 100vh;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 50% 50%, rgba(157, 96, 248, 0.03) 0%, transparent 70%),
      radial-gradient(circle at 80% 20%, rgba(204, 49, 232, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: 1;
  }
`;

const FormContainer = styled.div`
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(157, 96, 248, 0.15);
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 480px;
  text-align: center;
  box-shadow: 
    0 15px 40px rgba(0, 0, 0, 0.3),
    0 5px 20px rgba(157, 96, 248, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(157, 96, 248, 0.04) 0%, transparent 70%);
    border-radius: 1.5rem;
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(157, 96, 248, 0.25);
    box-shadow: 
      0 20px 50px rgba(0, 0, 0, 0.35),
      0 8px 25px rgba(157, 96, 248, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }
`;

const IconWrapper = styled.div`
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #CC31E8 0%, #9D60F8 100%);
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 
    0 8px 20px rgba(204, 49, 232, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  position: relative;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, #CC31E8, #9D60F8, #CC31E8);
    border-radius: 1.2rem;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: scale(1.03);
    box-shadow: 
      0 10px 25px rgba(204, 49, 232, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &::before {
      opacity: 0.6;
    }
  }
`;

const Title = styled(Heading1)`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: 700;
  margin-bottom: 1.2rem;
  background: linear-gradient(135deg, ${colors.textPrimary} 0%, rgba(157, 96, 248, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Message = styled(MutedText)`
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  color: ${colors.textMuted};

  &:last-of-type {
    margin-bottom: 1.5rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const PrimaryButton = styled.button`
  font-family: 'Montserrat', sans-serif;
  background: linear-gradient(135deg, #CC31E8 0%, #9D60F8 100%);
  border: none;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 6px 18px rgba(204, 49, 232, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 
      0 8px 22px rgba(204, 49, 232, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      box-shadow: 
        0 6px 18px rgba(204, 49, 232, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
  }
`;

const TertiaryButton = styled.button`
  font-family: 'Montserrat', sans-serif;
  background: none;
  border: none;
  color: ${colors.textMuted};
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0.5rem;

  &:hover {
    color: ${colors.textPrimary};
    background: rgba(255, 255, 255, 0.05);
  }
`;

const CodeInputContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem 0;
`;

const CodeInput = styled.input`
  width: 3rem;
  height: 3rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  border: 2px solid rgba(157, 96, 248, 0.3);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: ${colors.textPrimary};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #cc31e8;
    box-shadow: 0 0 0 3px rgba(204, 49, 232, 0.1);
  }

  &:invalid {
    border-color: #ef4444;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
`;

const SuccessMessage = styled.div`
  color: #10b981;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.5rem;
`;

const ConfirmEmail = () => {
  const { user, loading, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digits
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyCode = async (codeString) => {
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/verify_code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: codeString }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Email verified successfully!');
        setUser({ ...user, confirmed_at: new Date().toISOString() });
        setTimeout(() => navigate("/"), 1500);
      } else {
        setError(data.error || "Invalid verification code");
        setCode(['', '', '', '', '', '']); // Clear code on error
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (isSending) return;
    setIsSending(true);
    setTimer(60);
    setError('');
    setSuccess('');

    fetch(`${API_URL}/resend_verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setSuccess(data.message);
        } else {
          setError("Failed to resend verification code.");
        }
      })
      .catch(() => setError("An error occurred. Please try again."));
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Are you sure you want to log out?',
      content: 'You will need to log in again to access your account.',
      okText: 'Log out',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk() {
        fetch(`${API_URL}/logout`, {
          method: "DELETE",
          credentials: "include",
        }).then(() => {
          setUser(null);
          navigate("/");
        });
      },
    });
  };

  return (
    <PageContainer>
      <FormContainer>
        <IconWrapper>
          <Shield size={32} color="white" />
        </IconWrapper>
        <Title>Enter verification code</Title>
        <Message>We've sent a 6-digit code to your email address.</Message>
        <Message>Enter the code below to verify your account:</Message>

        <CodeInputContainer>
          {code.map((digit, index) => (
            <CodeInput
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isVerifying}
              autoFocus={index === 0}
            />
          ))}
        </CodeInputContainer>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <ButtonGroup>
          <PrimaryButton onClick={handleResend} disabled={isSending || isVerifying}>
            {isSending ? `Wait ${timer}s` : "Resend code"}
          </PrimaryButton>
          <TertiaryButton onClick={handleLogout} disabled={isVerifying}>
            Log out
          </TertiaryButton>
        </ButtonGroup>
      </FormContainer>
    </PageContainer>
  );
};

export default ConfirmEmail;