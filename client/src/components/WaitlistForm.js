import React, { useState } from 'react';
import styled from 'styled-components';
import { Mail, Smartphone, Bell } from 'lucide-react';
import { Heading1, MutedText } from '../styles/Typography'

const colors = {
    sectionBackground: '#251C2C',
    cardBackground: '#2a1e30',
    inputBackground: '#0D0B1F',
    border: '#3B3355',
    textPrimary: '#FFFFFF',
    textMuted: '#BEBEBE',
    accent: '#9D60F8',
};

const SmallHeading = styled.h3`
  font-size: 1.20rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #cc31e8;
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
  margin: 0.5rem auto 3rem auto;
  line-height: 1.6;
`;

const FormWrapper = styled.section`
  background-color: ${colors.sectionBackground};
  padding-bottom: 50px;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
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
  gap: 0.75rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ checked }) => (checked ? colors.textPrimary : colors.textMuted)};
  font-size: 1rem;
  cursor: pointer;

  svg {
    flex-shrink: 0;
  }
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  display: none;
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
        // prevent unchecking if it's the only one selected
        if (mobile && !product) return;
        setMobile((prev) => !prev);
    };

    const toggleProduct = () => {
        if (product && !mobile) return;
        setProduct((prev) => !prev);
    };

    const canSubmit = email && (mobile || product);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/waitlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ waitlist: { email, mobile, product } }),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Network response was not ok');
            setEmail('');
            setMobile(false);
            setProduct(false);
            alert('Thanks for joining the waitlist!');
        } catch (err) {
            console.error(err);
            alert('Oops, something went wrong.');
        }
        setLoading(false);
    };

    return (
        <div style={{paddingTop: '50px', backgroundColor: '#251C2C', padding: '4rem 1.5rem' }}>
            <SmallHeading>Stay Connected</SmallHeading>
            <Title>Get notified about Voxxy Updates</Title>
            <Subtitle>Sign up to be the first to know about our mobile app launch or to receive product
                updates and special offers.</Subtitle>
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </InputWrapper>
                        </Field>

                        <Field>
                            <Label>I'm interested in:</Label>
                            <CheckboxGroup>
                                <CheckboxLabel checked={mobile}>
                                    <HiddenCheckbox
                                        name="mobile"
                                        checked={mobile}
                                        onChange={toggleMobile}
                                    />
                                    <Smartphone
                                        size={20}
                                        color={mobile ? colors.accent : colors.border}
                                    />
                                    Mobile app waitlist
                                </CheckboxLabel>

                                <CheckboxLabel checked={product}>
                                    <HiddenCheckbox
                                        name="product"
                                        checked={product}
                                        onChange={toggleProduct}
                                    />
                                    <Bell size={20} color={product ? colors.accent : colors.border} />
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
