import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Mail, Star, Bug } from 'lucide-react';
import Footer from './Footer';
import colors from '../styles/Colors';
import { trackEvent, trackPageView } from '../utils/analytics';

const AutofillStyles = createGlobalStyle`
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus {
    -webkit-text-fill-color: ${colors.textPrimary} !important;
    transition: background-color 9999s ease-in-out 0s !important;
    box-shadow: 0 0 0px 1000px ${colors.background} inset !important;
  }
`;

const Page = styled.main`
  background: var(--color-space-900);
  color: var(--color-text-primary);
  padding: clamp(4rem, 8vw, 6.5rem) 1.5rem 0;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  gap: clamp(2.5rem, 6vw, 4rem);
`;

const Hero = styled.section`
  display: grid;
  gap: 1.2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5.5vw, 3.4rem);
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin: 0 auto;
  max-width: 60ch;
`;

const TabsRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 auto;
  flex-wrap: wrap;
  justify-content: center;
`;

const TabButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.5rem;
  border-radius: 999px;
  border: 1px solid rgba(203, 184, 255, 0.35);
  background: ${({ $active }) => ($active ? 'linear-gradient(120deg, rgba(110, 83, 255, 0.9), rgba(255, 87, 208, 0.75))' : 'rgba(255, 255, 255, 0.04)')};
  color: ${({ $active }) => ($active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)')};
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(146, 77, 255, 0.35);
  }
`;

const FormSection = styled.section`
  display: grid;
  justify-items: center;
  padding-bottom: clamp(3rem, 6vw, 4rem);
`;

const FormCard = styled.form`
  width: min(560px, 100%);
  background: linear-gradient(155deg, rgba(26, 18, 55, 0.92), rgba(44, 26, 77, 0.88));
  border: 1px solid rgba(210, 186, 255, 0.2);
  border-radius: 28px;
  padding: clamp(2rem, 4vw, 2.6rem);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1.4rem;
`;

const FormTitle = styled.h2`
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 3.5vw, 2.1rem);
  margin: 0;
  text-align: center;
`;

const InputGroup = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(203, 184, 255, 0.2);
  background: rgba(13, 8, 28, 0.65);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: border 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(110, 83, 255, 0.75);
    box-shadow: 0 0 0 3px rgba(110, 83, 255, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(203, 184, 255, 0.2);
  background: rgba(13, 8, 28, 0.65);
  color: var(--color-text-primary);
  font-size: 1rem;
  resize: vertical;
  transition: border 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(110, 83, 255, 0.75);
    box-shadow: 0 0 0 3px rgba(110, 83, 255, 0.2);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.95rem 1.4rem;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  border: none;
  color: var(--color-text-primary);
  background-image: linear-gradient(120deg, #6a36ff 0%, #ff36d5 52%, #ff9d3f 100%);
  box-shadow: 0 12px 35px rgba(146, 77, 255, 0.35);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 40px rgba(146, 77, 255, 0.45);
  }
`;

const StatusBanner = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.5;
  text-align: center;
  ${({ $variant }) =>
    $variant === 'success'
      ? `background: rgba(71, 249, 192, 0.12); color: var(--color-text-primary); border: 1px solid rgba(71, 249, 192, 0.4);`
      : `background: rgba(255, 107, 155, 0.12); color: var(--color-text-primary); border: 1px solid rgba(255, 107, 155, 0.4);`}
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const RatingButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: ${({ $active }) => ($active ? '1px solid rgba(255, 193, 7, 0.7)' : '1px solid rgba(203, 184, 255, 0.2)')};
  background: ${({ $active }) => ($active ? 'rgba(255, 193, 7, 0.12)' : 'rgba(13, 8, 28, 0.65)')};
  color: ${({ $active }) => ($active ? '#ffc107' : 'var(--color-text-secondary)')};
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(255, 193, 7, 0.2);
  }
`;

const SecondaryLink = styled.button`
  background: none;
  border: none;
  color: var(--color-plasma-300);
  font-family: var(--font-display);
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  justify-self: center;
`;

const tabs = [
  { key: 'feedback', label: 'Feedback', icon: Star },
  { key: 'contact', label: 'Contact', icon: Mail },
  { key: 'bug', label: 'Report a bug', icon: Bug },
];

const formTitles = {
  feedback: 'Share your feedback',
  contact: 'Send us a message',
  bug: 'Report a bug',
};

const ContactUs = () => {
  const [active, setActive] = useState('feedback');
  const [showContent, setShowContent] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [steps, setSteps] = useState('');

  useEffect(() => {
    trackPageView('Contact Page');
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowContent(true);
  }, []);

  const handleTabChange = (key) => {
    setActive(key);
    trackEvent('Contact Form Tab Selected', { tab: key });
  };

  const resetFields = () => {
    setName('');
    setEmail('');
    setRating(5);
    setMessage('');
    setSubject('');
    setContactMsg('');
    setBugDesc('');
    setSteps('');
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Network response was not ok');

      setSubmissionStatus({ type: 'success', message: 'Thank you! Your submission has been received. We will get back to you soon.' });
      trackEvent('Contact Form Submitted', { form: active, email });
      resetFields();
      setTimeout(() => setSubmissionStatus({ type: null, message: '' }), 5000);
    } catch (err) {
      setSubmissionStatus({ type: 'error', message: 'Something went wrong. Please try again later.' });
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

  return (
    <>
      <AutofillStyles />
      <Page>
        <Container>
          <Hero>
            <Title>Get in touch</Title>
            <Subtitle>We are here to help. Pick the path that matches what you need and we will respond shortly.</Subtitle>
            <TabsRow>
              {tabs.map(({ key, label, icon: Icon }) => (
                <TabButton key={key} $active={active === key} onClick={() => handleTabChange(key)}>                  <Icon size={18} /> {label}
                </TabButton>
              ))}
            </TabsRow>
          </Hero>

          {showContent && (
            <FormSection>
              <FormCard onSubmit={handleSubmit}>
                <FormTitle>{formTitles[active]}</FormTitle>

                <InputGroup>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                </InputGroup>

                <InputGroup>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
                </InputGroup>

                {active === 'feedback' && (
                  <InputGroup>
                    <Label>How was your experience?</Label>
                    <RatingRow>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <RatingButton
                          key={value}
                          type="button"
                          $active={value <= (hoveredStar || rating)}
                          onClick={() => { setRating(value); trackEvent('Feedback Rating Selected', { value }); }}
                          onMouseEnter={() => setHoveredStar(value)}
                          onMouseLeave={() => setHoveredStar(0)}
                          aria-label={`Rate ${value} stars`}
                        >
                          ★
                        </RatingButton>
                      ))}
                    </RatingRow>
                    <TextArea
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share what is working or what we can improve."
                      required
                    />
                  </InputGroup>
                )}

                {active === 'contact' && (
                  <>
                    <InputGroup>
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" required />
                    </InputGroup>
                    <InputGroup>
                      <Label htmlFor="contact-message">Message</Label>
                      <TextArea
                        id="contact-message"
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder="Tell us about your question or request."
                        required
                      />
                    </InputGroup>
                  </>
                )}

                {active === 'bug' && (
                  <>
                    <InputGroup>
                      <Label htmlFor="bug-desc">What went wrong?</Label>
                      <TextArea
                        id="bug-desc"
                        value={bugDesc}
                        onChange={(e) => setBugDesc(e.target.value)}
                        placeholder="Describe the issue you ran into."
                        required
                      />
                    </InputGroup>
                    <InputGroup>
                      <Label htmlFor="steps">Steps to reproduce (optional)</Label>
                      <TextArea
                        id="steps"
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        placeholder="Share any steps that help us recreate it."
                      />
                    </InputGroup>
                  </>
                )}

                {submissionStatus.type && (
                  <StatusBanner $variant={submissionStatus.type}>{submissionStatus.message}</StatusBanner>
                )}

                <SubmitButton type="submit" disabled={!canSubmit() || isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Submit'}
                </SubmitButton>

                {active !== 'feedback' && (
                  <SecondaryLink type="button" onClick={() => setActive('feedback')}>Switch to feedback form</SecondaryLink>
                )}
              </FormCard>
            </FormSection>
          )}
        </Container>
      </Page>
      <Footer />
    </>
  );
};

export default ContactUs;
