import React, { useState } from 'react';
import styled from 'styled-components';
import { Mail, Star, Bug } from 'lucide-react';
import { Heading1, MutedText } from '../styles/Typography';
import Footer from './Footer';

const colors = {
    sectionBackground: '#251C2C',
    cardBackground: '#2a1e30',
    inputBackground: '#0D0B1F',
    border: '#3B3355',
    textPrimary: '#FFFFFF',
    textMuted: '#BEBEBE',
    accent: '#9D60F8',
};

const Title = styled(Heading1)`
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  color: ${colors.textPrimary}
`;

const Subtitle = styled(MutedText)`
  font-size: 1.125rem;
  color: ${colors.textMuted};
  max-width: 700px;
  margin: 0 auto 2.5rem auto;
  line-height: 1.6;
  padding-left: 15px;
  padding-right: 15px;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const Tab = styled.button`
  background: transparent;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? colors.accent : 'transparent')};
  color: ${({ $active }) => ($active ? colors.textPrimary : colors.textMuted)};
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: ${colors.accent};
  }
`;

const FormWrapper = styled.section`
  background-color: ${colors.sectionBackground};
  padding: 50px 20px;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
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

const StyledTextarea = styled.textarea`
  background: ${colors.inputBackground};
  border: 1px solid ${colors.border};
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: ${colors.textPrimary};
  font-size: 1rem;
  width: 100%;
  min-height: 100px;
  resize: vertical;
  outline: none;

  &::placeholder {
    color: ${colors.textMuted};
  }
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
    background-color: ${({ disabled }) =>
        disabled ? colors.accent : '#7f3bdc'};
  }
`;

export default function ContactUs() {
    const tabs = [
        { key: 'feedback', label: 'Feedback', icon: Star },
        { key: 'contact', label: 'Contact', icon: Mail },
        { key: 'bug', label: 'Bugs', icon: Bug },
    ];
    const [active, setActive] = useState('feedback');

    // Shared fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Feedback
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState('');

    // Contact
    const [subject, setSubject] = useState('');
    const [contactMsg, setContactMsg] = useState('');

    // Bug
    const [bugDesc, setBugDesc] = useState('');
    const [steps, setSteps] = useState('');

    const resetFields = () => {
        setName(''); setEmail('');
        setRating(5); setMessage('');
        setSubject(''); setContactMsg('');
        setBugDesc(''); setSteps('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let url = '';
        let body = {};

        if (active === 'feedback') {
            url = '/feedbacks';
            body = { feedback: { name, email, rating, message } };
        } else if (active === 'contact') {
            url = '/contacts';
            body = { contact: { name, email, subject, message: contactMsg } };
        } else {
            url = '/bug_reports';
            body = { bug_report: { name, email, bug_description: bugDesc, steps_to_reproduce: steps } };
        }

        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${url}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) throw new Error('Network response was not ok');
            alert('Submission successful!');
            resetFields();
        } catch (err) {
            console.error(err);
            alert('Oops, something went wrong.');
        }
    };

    const canSubmit = () => {
        if (!name || !email) return false;
        if (active === 'feedback') return message.trim() !== '';
        if (active === 'contact') return subject.trim() && contactMsg.trim();
        if (active === 'bug') return bugDesc.trim();
        return false;
    };

    return (
        <div style={{ backgroundColor: colors.sectionBackground, paddingTop: '100px' }}>
            <Title>Contact Us</Title>
            <Subtitle>We're here to help! Choose how you'd like to reach us & we will be in touch shortly.</Subtitle>
            <TabContainer>
                {tabs.map(({ key, label, icon: Icon }) => (
                    <Tab
                        key={key}
                        $active={active === key}
                        onClick={() => setActive(key)}
                    >
                        <Icon size={20} /> {label}
                    </Tab>
                ))}
            </TabContainer>
            <FormWrapper>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <Field>
                            <Label htmlFor="name">Name</Label>
                            <InputWrapper>
                                <StyledInput
                                    id="name"
                                    type="text"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </InputWrapper>
                        </Field>

                        <Field>
                            <Label htmlFor="email">Email</Label>
                            <InputWrapper>
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

                        {active === 'feedback' && (
                            <>
                                <Field>
                                    <Label htmlFor="rating">Rating (1-5)</Label>
                                    <InputWrapper>
                                        <StyledInput
                                            id="rating"
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={rating}
                                            onChange={(e) => setRating(e.target.value)}
                                            required
                                        />
                                    </InputWrapper>
                                </Field>
                                <Field>
                                    <Label htmlFor="feedback-message">Message</Label>
                                    <StyledTextarea
                                        id="feedback-message"
                                        placeholder="Your feedback..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    />
                                </Field>
                            </>
                        )}

                        {active === 'contact' && (
                            <>
                                <Field>
                                    <Label htmlFor="subject">Subject</Label>
                                    <InputWrapper>
                                        <StyledInput
                                            id="subject"
                                            type="text"
                                            placeholder="Subject"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            required
                                        />
                                    </InputWrapper>
                                </Field>
                                <Field>
                                    <Label htmlFor="contact-message">Message</Label>
                                    <StyledTextarea
                                        id="contact-message"
                                        placeholder="Your message..."
                                        value={contactMsg}
                                        onChange={(e) => setContactMsg(e.target.value)}
                                        required
                                    />
                                </Field>
                            </>
                        )}

                        {active === 'bug' && (
                            <>
                                <Field>
                                    <Label htmlFor="bug-desc">Bug Description</Label>
                                    <StyledTextarea
                                        id="bug-desc"
                                        placeholder="Describe the bug..."
                                        value={bugDesc}
                                        onChange={(e) => setBugDesc(e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field>
                                    <Label htmlFor="steps">Steps to Reproduce (optional)</Label>
                                    <StyledTextarea
                                        id="steps"
                                        placeholder="Steps to reproduce the bug..."
                                        value={steps}
                                        onChange={(e) => setSteps(e.target.value)}
                                    />
                                </Field>
                            </>
                        )}

                        <SubmitButton type="submit" disabled={!canSubmit()}>
                            Submit
                        </SubmitButton>
                    </form>
                </Card>
            </FormWrapper>
            <Footer />
        </div>
    );
}
