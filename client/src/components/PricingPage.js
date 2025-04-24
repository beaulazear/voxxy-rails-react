// src/components/EnterpriseSolutionsPage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { User, Mail, MessageSquare } from 'lucide-react';
import colors from '../styles/Colors';
import { Heading1, MutedText } from '../styles/Typography';
import Footer from './Footer';

const gradient = `
  background: linear-gradient(
    to right,
    hsl(291, 80%, 55%, 0.9),
    hsl(262, 95%, 70%, 0.9),
    hsl(267, 90%, 65%, 0.9)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${colors.background};
  color: ${colors.textPrimary};
  padding: 4rem 1rem;
  padding-top: 100px;
`;

const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;


// const SectionSubheading = styled.h2`
//   ${gradient}
//   font-size: 1.5rem;
//   margin-bottom: 1rem;
//   text-align: left;
// `;

const Title = styled(Heading1)`
  ${gradient}
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: 0.5rem;
`;

const Subtitle = styled(MutedText)`
  font-size: 1.125rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
  justify-items: start;
`;

const Card = styled.div`
  background-color: #251D2B;
  border: 1px solid rgba(157, 96, 248, 0.2);
  border-radius: 12px;
  padding: 2rem;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    border-color: ${colors.accent};
  }
`;

const CardTitle = styled.h3`
  ${gradient}
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
`;

const CardText = styled.p`
  font-size: 1rem;
  line-height: 1.5;
`;

const FormWrapper = styled.div`
  background-color: #251D2B;
  border: 1px solid rgba(157, 96, 248, 0.2);
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  text-align: left;
`;

const FormHeader = styled.h2`
  ${gradient}
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const FormText = styled(MutedText)`
  font-size: 1rem;
  margin-bottom: 1.5rem;
`;

const Field = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${colors.textPrimary};
  font-size: 1rem;
`;

const IconWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: ${colors.textMuted};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background-color: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 8rem;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background-color: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  resize: vertical;

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const Button = styled.button`
  background-color: ${colors.accent};
  color: ${colors.background};
  border: none;
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #be44ff;
  }
`;

export default function EnterpriseSolutionsPage() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contact: form })
            });
            if (!res.ok) throw new Error();
            setStatus('success');
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch {
            setStatus('error');
        }
    };

    return (
        <>
            <PageContainer>
                <Container>
                    <SectionHeader>
                        <Title>Enterprise Solutions</Title>
                        <Subtitle>Tailored planning solutions for your business needs</Subtitle>
                    </SectionHeader>

                    {/* <SectionSubheading>Why Choose Voxxy for Business?</SectionSubheading> */}

                    <CardGrid>
                        <Card>
                            <CardTitle>Custom Solutions</CardTitle>
                            <CardText>
                                Tailored software and services designed specifically for your
                                organization’s unique requirements.
                            </CardText>
                        </Card>
                        <Card>
                            <CardTitle>Enterprise Support</CardTitle>
                            <CardText>
                                Dedicated account management and priority technical support.
                            </CardText>
                        </Card>
                        <Card>
                            <CardTitle>Advanced Security</CardTitle>
                            <CardText>
                                Enhanced security features and compliance measures for
                                enterprise-grade protection.
                            </CardText>
                        </Card>
                        <Card>
                            <CardTitle>Custom Integration</CardTitle>
                            <CardText>
                                Seamless integration with your existing tools and workflows.
                            </CardText>
                        </Card>
                    </CardGrid>

                    <FormWrapper>
                        <FormHeader>Get in Touch</FormHeader>
                        <FormText>
                            Contact us to learn more about our enterprise solutions and how we
                            can help your business.
                        </FormText>

                        <form onSubmit={handleSubmit}>
                            <Field>
                                <Label htmlFor="name">Name</Label>
                                <div style={{ position: 'relative' }}>
                                    <IconWrapper>
                                        <User size={20} />
                                    </IconWrapper>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                            </Field>

                            <Field>
                                <Label htmlFor="email">Email</Label>
                                <div style={{ position: 'relative' }}>
                                    <IconWrapper>
                                        <Mail size={20} />
                                    </IconWrapper>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="your.email@example.com"
                                        required
                                    />
                                </div>
                            </Field>

                            <Field>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="What's this about?"
                                    required
                                    style={{ paddingLeft: '1rem' }}
                                />
                            </Field>

                            <Field>
                                <Label htmlFor="message">Message</Label>
                                <div style={{ position: 'relative' }}>
                                    <IconWrapper>
                                        <MessageSquare size={20} />
                                    </IconWrapper>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={form.message}
                                        onChange={handleChange}
                                        placeholder="How can we help?"
                                        required
                                    />
                                </div>
                            </Field>

                            <Button type="submit">
                                {status === 'loading'
                                    ? 'Sending…'
                                    : status === 'success'
                                        ? 'Sent!'
                                        : 'Send Message'}
                            </Button>
                            {status === 'error' && (
                                <p style={{ color: 'tomato', marginTop: '1rem' }}>
                                    Something went wrong. Please try again.
                                </p>
                            )}
                        </form>
                    </FormWrapper>
                </Container>
            </PageContainer>
            <Footer />
        </>
    );
}