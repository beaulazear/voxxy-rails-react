import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, css, keyframes } from 'styled-components';
import { Mail, Star, Bug } from 'lucide-react';
import { Heading1, MutedText } from '../styles/Typography';
import Footer from './Footer';
import mixpanel from 'mixpanel-browser';
import colors from '../styles/Colors';

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

const ContentContainer = styled.div`
  background-color: ${colors.backgroundTwo};
  opacity: ${({ $isVisible }) => ($isVisible ? "1" : "0")};
  transition: opacity 0.7s ease-in-out;
  min-height: 100vh;
  overflow-x: hidden;
`;

const StaggeredContent = styled.div`
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;

  ${({ $isVisible }) =>
    $isVisible &&
    css`
      opacity: 1;
      transform: translateY(0);
    `}
`;

const HeaderSection = styled.div`
  padding-top: 150px;
  padding-bottom: 3rem;
  padding-left: 0;
  padding-right: 0;
  
  @media (max-width: 768px) {
    padding-top: 120px;
    padding-bottom: 2.5rem;
  }
  
  @media (max-width: 480px) {
    padding-top: 100px;
    padding-bottom: 2rem;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(to right,
    ${colors.gradient.start},
    ${colors.gradient.end});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
`;

const Title = styled(Heading1)`
  font-size: clamp(2rem, 5vw, 3.75rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  color: ${colors.textPrimary};
  text-align: center;
  padding: 0 1rem;
  
  @media (max-width: 480px) {
    font-size: 1.875rem;
  }
`;

const Subtitle = styled(MutedText)`
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: ${colors.textMuted};
  max-width: 700px;
  margin: 0 auto 2rem auto;
  line-height: 1.6;
  padding: 0 1.5rem;
  text-align: center;
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    gap: 0.35rem;
    margin-bottom: 1.5rem;
  }
`;

const Tab = styled.button`
  background: ${({ $active }) => ($active ? colors.primaryButton : 'transparent')};
  border: 2px solid ${({ $active }) => ($active ? colors.primaryButton : colors.borderLight)};
  border-radius: 9999px;
  color: ${({ $active }) => ($active ? colors.textPrimary : colors.textMuted)};
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  @media (max-width: 480px) {
    padding: 0.6rem 1rem;
    font-size: 0.875rem;
    gap: 0.35rem;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }

  &:hover {
    background-color: ${({ $active }) => ($active ? colors.hoverHighlight : colors.primaryButton)};
    color: ${colors.textPrimary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(107, 70, 193, 0.3);
    border-color: ${colors.primaryButton};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FormWrapper = styled.section`
  background-color: ${colors.backgroundTwo};
  padding: 2rem 1rem 4rem;
  display: flex;
  justify-content: center;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem 3rem;
  }
  
  @media (max-width: 480px) {
    padding: 1rem 0.5rem 2rem;
  }
`;

const FormTitle = styled.h2`
  font-size: clamp(1.25rem, 3.5vw, 2.5rem);
  font-weight: 600;
  margin: 0 auto 1.5rem;
  color: ${colors.textPrimary};
  text-align: center;
  padding: 0 1rem;
  
  @media (max-width: 480px) {
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid ${colors.borderDark};
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 1.75rem;
    max-width: calc(100% - 2rem);
    margin: 0 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 0.75rem;
    max-width: calc(100% - 1rem);
    margin: 0 0.5rem;
  }
  
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

const Field = styled.div`
  margin-bottom: 1.5rem;
  
  @media (max-width: 480px) {
    margin-bottom: 1.25rem;
  }
`;

const Label = styled.label`
  display: block;
  color: ${colors.textPrimary};
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-align: left;
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.background};
  border: 1px solid ${colors.borderLight};
  border-radius: 0.75rem;
  padding: 0.75rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  width: 100%;
  
  &:focus-within {
    border-color: ${colors.primaryButton};
    box-shadow: 0 0 0 2px rgba(107, 70, 193, 0.1);
  }
  
  @media (max-width: 480px) {
    padding: 0.6rem;
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
  
  @media (max-width: 480px) {
    font-size: 16px; /* Prevents zoom on iOS */
  }
`;

const StyledTextarea = styled.textarea`
  background: ${colors.background};
  border: 1px solid ${colors.borderLight};
  border-radius: 0.75rem;
  padding: 0.75rem;
  color: ${colors.textPrimary};
  font-size: 1rem;
  width: 100%;
  min-height: 120px;
  resize: vertical;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: ${colors.textMuted};
  }
  
  &:focus {
    border-color: ${colors.primaryButton};
    box-shadow: 0 0 0 2px rgba(107, 70, 193, 0.1);
  }
  
  @media (max-width: 480px) {
    font-size: 16px; /* Prevents zoom on iOS */
    min-height: 100px;
    padding: 0.6rem;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem 1.8rem;
  background: linear-gradient(135deg, ${colors.primaryButton}, ${colors.secondaryButton});
  color: ${colors.textPrimary};
  border: none;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  box-shadow: 0 2px 8px rgba(107, 70, 193, 0.3);
  
  @media (max-width: 480px) {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(107, 70, 193, 0.4);
    background: linear-gradient(135deg, ${colors.secondaryButton}, ${colors.hoverHighlight});
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const SuccessMessage = styled.div`
  padding: 1rem;
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid ${colors.success};
  border-radius: 0.75rem;
  color: ${colors.success};
  text-align: center;
  margin-top: 1rem;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid ${colors.destructive};
  border-radius: 0.75rem;
  color: ${colors.destructive};
  text-align: center;
  margin-top: 1rem;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const StarRatingContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  background-color: ${colors.background};
  border: 1px solid ${colors.borderLight};
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  flex-wrap: wrap;
  justify-content: center;
  
  &:focus-within {
    border-color: ${colors.primaryButton};
    box-shadow: 0 0 0 2px rgba(107, 70, 193, 0.1);
  }
  
  @media (max-width: 480px) {
    gap: 0.25rem;
    padding: 0.5rem;
  }
`;

const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.2s ease;
  color: ${({ $filled }) => ($filled ? '#FFC107' : colors.borderLight)};
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  
  &:hover {
    transform: scale(1.2);
    filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.6));
  }
  
  &:active {
    animation: ${pulseAnimation} 0.3s ease;
  }
  
  svg {
    width: 28px;
    height: 28px;
    fill: ${({ $filled }) => ($filled ? '#FFC107' : 'none')};
    stroke: ${({ $filled }) => ($filled ? '#FFC107' : colors.borderLight)};
    stroke-width: 2;
    transition: all 0.2s ease;
  }
  
  &:focus {
    outline: none;
    filter: drop-shadow(0 0 12px rgba(255, 193, 7, 0.8));
  }
  
  @media (max-width: 480px) {
    padding: 0.35rem;
    
    svg {
      width: 32px;
      height: 32px;
    }
    
    &:hover {
      transform: scale(1.1);
    }
  }
`;

const RatingText = styled.span`
  margin-left: 1rem;
  color: ${colors.textMuted};
  font-size: 0.875rem;
  font-weight: 500;
  
  @media (max-width: 480px) {
    margin-left: 0.5rem;
    font-size: 0.8rem;
    width: 100%;
    text-align: center;
    margin-top: 0.5rem;
  }
`;

export default function ContactUs() {
    const tabs = [
        { key: 'feedback', label: 'Feedback', icon: Star },
        { key: 'contact', label: 'Contact', icon: Mail },
        { key: 'bug', label: 'Bugs', icon: Bug },
    ];
    const [active, setActive] = useState('feedback');
    const [showContent, setShowContent] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState({ type: null, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

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

    const formTitles = {
        feedback: 'Leave Your Feedback',
        contact: 'Send Us a Message',
        bug: 'Report a Bug',
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setShowContent(true);

        if (process.env.NODE_ENV === 'production') {
            mixpanel.track('Contact Us Page Loaded');
        }
    }, []);

    const resetFields = () => {
        setName(''); setEmail('');
        setRating(5); setMessage('');
        setSubject(''); setContactMsg('');
        setBugDesc(''); setSteps('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionStatus({ type: null, message: '' });
        
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
            
            setSubmissionStatus({ 
                type: 'success', 
                message: 'Thank you! Your submission has been received. We\'ll get back to you soon.' 
            });
            resetFields();
            
            setTimeout(() => {
                setSubmissionStatus({ type: null, message: '' });
            }, 5000);
        } catch (err) {
            console.error(err);
            setSubmissionStatus({ 
                type: 'error', 
                message: 'Oops! Something went wrong. Please try again later.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = () => {
        if (!name || !email) return false;
        if (active === 'feedback') return message.trim() !== '';
        if (active === 'contact') return subject.trim() && contactMsg.trim();
        if (active === 'bug') return bugDesc.trim();
        return false;
    };

    const getRatingText = (value) => {
        const texts = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Great',
            5: 'Excellent!'
        };
        return texts[value] || '';
    };

    return (
        <>
            <AutofillStyles />
            <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
                <ContentContainer $isVisible={showContent}>
                    <StaggeredContent $isVisible={showContent}>
                        <HeaderSection>
                            <Title>
                                Get in <GradientText>Touch</GradientText>
                            </Title>
                            <Subtitle>
                                We're here to help! Choose how you'd like to reach us and we'll get back to you as soon as possible.
                            </Subtitle>
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
                        </HeaderSection>
                    </StaggeredContent>
                    <StaggeredContent $isVisible={showContent} style={{ transitionDelay: '0.2s' }}>
                        <FormWrapper>
                            <Card>
                                <FormTitle>{formTitles[active]}</FormTitle>
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
                                    <Label>How would you rate your experience?</Label>
                                    <StarRatingContainer>
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <StarButton
                                                key={value}
                                                type="button"
                                                $filled={value <= (hoveredStar || rating)}
                                                onClick={() => setRating(value)}
                                                onMouseEnter={() => setHoveredStar(value)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                aria-label={`Rate ${value} stars`}
                                            >
                                                <Star />
                                            </StarButton>
                                        ))}
                                        <RatingText>
                                            {getRatingText(hoveredStar || rating)}
                                        </RatingText>
                                    </StarRatingContainer>
                                </Field>
                                <Field>
                                    <Label htmlFor="feedback-message">Message</Label>
                                    <StyledTextarea
                                        id="feedback-message"
                                        placeholder="Tell us more about your experience..."
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

                                <SubmitButton type="submit" disabled={!canSubmit() || isSubmitting}>
                                    {isSubmitting ? 'Sending...' : 'Submit'}
                                </SubmitButton>
                                {submissionStatus.type === 'success' && (
                                    <SuccessMessage>{submissionStatus.message}</SuccessMessage>
                                )}
                                {submissionStatus.type === 'error' && (
                                    <ErrorMessage>{submissionStatus.message}</ErrorMessage>
                                )}
                            </form>
                        </Card>
                    </FormWrapper>
                </StaggeredContent>
                <Footer />
            </ContentContainer>
        </div>
        </>
    );
}
