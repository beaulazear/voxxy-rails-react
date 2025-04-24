import React, { useState } from 'react';
import styled from 'styled-components';
import { Mail, Check } from 'lucide-react';
import { Heading1, MutedText } from '../styles/Typography'

const colors = {
  sectionBackground: '#251C2C',
  cardBackground: '#2a1e30',
  inputBackground: '#0D0B1F',
  border: '#3B3355',
  textPrimary: '#FFFFFF',
  textMuted: '#7A7A85',
  accent: '#9D60F8',
};

const SmallHeading = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${colors.accent};
  opacity: 0.9;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;

const Subtitle = styled(MutedText)`
  font-size: 1rem;
  max-width: 600px;
  margin: 0.5rem auto 3rem;
  line-height: 1.6;
  color: ${colors.textMuted};
`;

const FormWrapper = styled.section`
  background-color: ${colors.sectionBackground};
  padding: 4rem 1.5rem;
  padding-top: .5rem;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
`;

const Field = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: ${colors.textPrimary};
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.inputBackground};
  border: 1px solid ${colors.border};
  border-radius: 0.5rem;
  padding: 0.75rem;
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

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  color: ${({ checked }) => (checked ? colors.textPrimary : colors.textMuted)};
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const StyledCheckbox = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  background: ${({ checked }) => (checked ? colors.accent : 'transparent')};
  border: 2px solid ${colors.border};
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms, border-color 150ms;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${colors.accent};
  color: ${colors.textPrimary};
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? colors.accent : '#7f3bdc')};
  }
`;

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState(true);
  const [product, setProduct] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleMobile = () => {
    if (mobile && !product) return;
    setMobile(prev => !prev);
  };

  const toggleProduct = () => {
    if (product && !mobile) return;
    setProduct(prev => !prev);
  };

  const canSubmit = email && (mobile || product);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/waitlists`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waitlist: { email, mobile, product } }),
          credentials: 'include',
        }
      );
      if (!res.ok) throw new Error('Network response was not ok');
      setEmail('');
      setMobile(false);
      setProduct(false);
      alert('Thanks for joining the waitlist!');
    } catch {
      alert('Oops, something went wrong.');
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: colors.sectionBackground }}>
      <SmallHeading>Stay Connected</SmallHeading>
      <Title>Get notified about Voxxy Updates</Title>
      <Subtitle>
        Sign up to be the first to know about our mobile app launch or to receive product
        updates and special offers.
      </Subtitle>
      <FormWrapper>
        <Card>
          <form onSubmit={handleSubmit}>
            <Field>
              <Label htmlFor="email">Email</Label>
              <InputWrapper>
                <Mail color={colors.textMuted} />
                <StyledInput
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </InputWrapper>
            </Field>

            <Field>
              <Label>I'm interested in:</Label>
              <CheckboxGroup>
                <CheckboxLabel checked={mobile}>
                  <HiddenCheckbox
                    checked={mobile}
                    onChange={toggleMobile}
                  />
                  <StyledCheckbox checked={mobile}>
                    {mobile && <Check size={14} color={colors.textPrimary} />}
                  </StyledCheckbox>
                  Mobile app waitlist
                </CheckboxLabel>

                <CheckboxLabel checked={product}>
                  <HiddenCheckbox
                    checked={product}
                    onChange={toggleProduct}
                  />
                  <StyledCheckbox checked={product}>
                    {product && <Check size={14} color={colors.textPrimary} />}
                  </StyledCheckbox>
                  Product updates
                </CheckboxLabel>
              </CheckboxGroup>
            </Field>

            <SubmitButton type="submit" disabled={!canSubmit || loading}>
              {loading ? 'Joining...' : 'Join Waitlist'}
            </SubmitButton>
          </form>
        </Card>
      </FormWrapper>
    </div>
  );
}