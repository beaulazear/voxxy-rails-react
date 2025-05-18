import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Mail } from 'lucide-react';
import { Heading1, MutedText } from '../styles/Typography';

const colors = {
  sectionBackground: '#251C2C',
  cardBackground: '#2a1e30',
  inputBackground: '#211825',
  border: '#442f4f',
  textPrimary: '#FFFFFF',
  textMuted: '#dbd3de',
  accent: '#cc31e8',
  error: '#e55353',
  success: '#FFFFFF',
};

const SmallHeading = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${colors.accent};
  opacity: 0.9;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.25rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
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
    box-shadow: 0 0 0px 1000px ${colors.inputBackground} inset !important;
  }
`;

const FormWrapper = styled.section`
  background-color: ${colors.sectionBackground};
  padding: 1rem .5rem 6rem;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4);
  border: 1px solid ${colors.border};
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover {
    border-color: ${colors.accent};
    box-shadow: 0 0 10px ${colors.accent}, 0 0 50px ${colors.accent};
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.inputBackground};
  border: 1px solid ${colors.border};
  border-radius: 0.75rem;
  padding: 0.75rem;
  gap: 0.75rem;
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
  background-color: ${colors.accent};
  color: ${colors.textPrimary};
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  &:hover {
    background-color: ${({ disabled }) => (disabled ? colors.accent : '#7f3bdc')};
  }
`;

const MessageText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 750px;
  text-align: center;
  margin: 0.5rem auto 0.5rem;
  padding: 1rem;
  color: ${({ $error }) => ($error ? colors.error : colors.success)};
 `;

const HeaderWrapper = styled.div`
  padding: 2rem 1rem;
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
    <div style={{ backgroundColor: colors.sectionBackground }}>
      <AutofillStyles />
      <HeaderWrapper>
        <SmallHeading>Stay Connected</SmallHeading>
        <Title>
          Get product updates from Voxxy <Mail color={colors.textMuted} size={20} />
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