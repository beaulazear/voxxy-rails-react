import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors';

const SmallHeading = styled.h3`
  font-size: 1.20rem;
  font-weight: 700;
  color: ${colors.secondaryButton};
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.1rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
`;

const Subtitle = styled(MutedText)`
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 750px;
  text-align: center;
  margin: 0.5rem auto 0;
`;

const AutofillStyles = createGlobalStyle`
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus {
    -webkit-text-fill-color: ${colors.textPrimary} !important;
    transition: background-color 5000s ease-in-out 0s !important;
    box-shadow: 0 0 0px 1000px ${colors.background} inset !important;
  }
`;

const FormWrapper = styled.section`
  background-color: ${colors.backgroundTwo};
  padding: 1rem .5rem 6rem;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid ${colors.borderDark};
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    border-color: ${colors.primaryButton};
  }
  
  &:focus-within {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.background};
  border: 1px solid ${colors.borderLight};
  border-radius: 0.75rem;
  padding: 0.75rem;
  gap: 0.75rem;
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: ${colors.primaryButton};
    box-shadow: 0 0 0 2px rgba(107, 70, 193, 0.1);
  }
`;

const StyledInput = styled.input`
  background: transparent;
  border: none;
  flex: 1;
  color: ${colors.textPrimary};
  font-size: 1rem;
  outline: none;
  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const SubmitButton = styled.button`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, ${colors.primaryButton}, ${colors.secondaryButton});
  color: ${colors.textPrimary};
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  box-shadow: 0 2px 8px rgba(107, 70, 193, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107, 70, 193, 0.4);
    background: linear-gradient(135deg, ${colors.secondaryButton}, ${colors.hoverHighlight});
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
  }
`;

const MessageText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  max-width: 750px;
  text-align: center;
  margin: 0.5rem auto 0.5rem;
  padding: 1rem;
  color: ${({ $error }) => ($error ? colors.destructive : colors.success)};
  border-radius: 0.5rem;
  background-color: ${({ $error }) => ($error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)')};
 `;

const HeaderWrapper = styled.div`
  padding: 3rem 1rem 2rem;
  text-align: center;
`;

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const canSubmit = email && isValid;

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setIsValid(emailRegex.test(val));
    // clear any previous message when editing
    setMessage('');
    setIsError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/waitlists`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waitlist: { email } }),
          credentials: 'include',
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg = data.errors
          ? data.errors.join(', ')
          : 'Something went wrong — please try again.';
        throw new Error(errMsg);
      }

      if (process.env.NODE_ENV === 'production') {
        fetch('/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
          },
          body: JSON.stringify({
            event: 'Waitlist Form Submitted',
            properties: {}
          }),
          credentials: 'include'
        }).catch(err => console.error('Analytics tracking failed:', err));
      }

      setEmail('');
      setMessage('Thank you for joining the list! We’ll be in touch soon with exciting new Voxxy updates. 🎉');
      setIsError(false);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: colors.backgroundTwo }}>
      <AutofillStyles />
      <HeaderWrapper>
        <SmallHeading>Stay Connected</SmallHeading>
        <Title>
          Get product updates from Voxxy
        </Title>
        <Subtitle>
          Sign up to follow our journey and get early access to new features, updates, and launch perks, all in one place.
        </Subtitle>
      </HeaderWrapper>
      <FormWrapper>
        <Card>
          <form onSubmit={handleSubmit}>
            <InputRow>
              <StyledInput
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={handleEmailChange}
                required
              />
              <SubmitButton type="submit" disabled={!canSubmit || loading}>
                {loading ? 'Joining...' : 'Get Notified'}
              </SubmitButton>
            </InputRow>
            {message && <MessageText $error={isError}>{message}</MessageText>}
          </form>
        </Card>
      </FormWrapper>
    </div>
  );
}