import React, { useEffect } from 'react';
import styled from 'styled-components';
import { FileText, UserCheck, User, Slash, Code, CloudOff, AlertTriangle, Power, Gavel, Mail } from 'lucide-react';
import Footer from './Footer';
import colors from '../styles/Colors';

const Section = styled.section`
  background-color: ${colors.background};
  padding: 100px 20px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #9261E5;
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const SubTitle = styled.p`
  color: ${colors.textMuted};
  font-size: 1rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const IntroWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 3rem;
`;

const Bar = styled.div`
  width: 4px;
  background-color: #9261E5;
  border-radius: 2px;
  align-self: stretch;
`;

const IntroText = styled.p`
  color: ${colors.textPrimary};
  font-size: 1.125rem;
  line-height: 1.6;
  text-align: left;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 2rem;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  color: ${colors.textPrimary};
  font-size: 1.5rem;
  margin: 0;
`;

const CardDescription = styled.div`
  color: ${colors.textPrimary};
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  text-align: left;
`;

export default function TermsOfServicePage() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <>
            <Section>
                <Container>
                    <Title>Terms of Service</Title>
                    <SubTitle>Effective Date: 4/23/2025 | Last Updated: 4/23/2025</SubTitle>
                    <IntroWrapper>
                        <Bar />
                        <IntroText>
                            Welcome to Voxxy! By using our website and services, you agree to these terms.
                        </IntroText>
                    </IntroWrapper>

                    <CardsContainer>
                        <Card>
                            <CardHeader>
                                <FileText size={24} color="#9261E5" />
                                <CardTitle>1. Agreement</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>These Terms of Service are a binding contract between you and Voxxy Inc., a Delaware corporation. By using Voxxy, you agree to abide by these terms and our Privacy Policy.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <UserCheck size={24} color="#9261E5" />
                                <CardTitle>2. Eligibility</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>You must be 13 or older to use Voxxy.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <User size={24} color="#9261E5" />
                                <CardTitle>3. Your Account</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <ul>
                                    <li>You're responsible for keeping your account details accurate and secure.</li>
                                    <li>You're liable for any activity that happens through your account.</li>
                                </ul>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Slash size={24} color="#9261E5" />
                                <CardTitle>4. Acceptable Use</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>You agree not to:</p>
                                <ul>
                                    <li>Break the law</li>
                                    <li>Disrupt our services</li>
                                    <li>Attempt to reverse-engineer or misuse the app</li>
                                    <li>Submit harmful or false content</li>
                                </ul>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Code size={24} color="#9261E5" />
                                <CardTitle>5. Ownership & IP</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>All content on Voxxy, including designs, code, logos, and copy, belongs to Voxxy Inc. You may not copy or reuse it without permission.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CloudOff size={24} color="#9261E5" />
                                <CardTitle>6. Availability</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>We're constantly improving. We may change or remove features at any time without notice. We're not responsible for downtime.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <AlertTriangle size={24} color="#9261E5" />
                                <CardTitle>7. Liability Disclaimer</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>To the fullest extent permitted by Delaware law, Voxxy is not liable for any indirect, incidental, or consequential damages related to your use of the service.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Power size={24} color="#9261E5" />
                                <CardTitle>8. Termination</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>We may suspend or terminate your account for any violations of these terms.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Gavel size={24} color="#9261E5" />
                                <CardTitle>9. Governing Law</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>These Terms are governed by the laws of the State of Delaware, without regard to its conflict of law principles.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Mail size={24} color="#9261E5" />
                                <CardTitle>10. Contact</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>Have questions? Contact us at <a href="mailto:team@voxxyai.com" style={{ color: '#9261E5' }}>team@voxxyai.com</a>.</p>
                            </CardDescription>
                        </Card>
                    </CardsContainer>
                </Container>
            </Section>
            <Footer />
        </>
    );
}
