import React, { useEffect } from 'react';
import styled from 'styled-components';
import { FileText, UserCheck, User, Slash, Code, CloudOff, AlertTriangle, Power, Gavel, Mail, Shield, CreditCard, MessageSquare, AlertCircle } from 'lucide-react';
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
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, ${colors.gradient.start}, ${colors.hoverHighlight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
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
                            Welcome to Voxxy! By using our website, mobile app, and services, you agree to these terms. You must be at least 13 years old to use Voxxy.
                        </IntroText>
                    </IntroWrapper>

                    <CardsContainer>
                        <Card>
                            <CardHeader>
                                <FileText size={24} color="#9261E5" />
                                <CardTitle>1. Agreement</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>These Terms of Service are a binding contract between you and Voxxy AI, Inc., a Delaware corporation. By using Voxxy, you agree to abide by these terms and our Privacy Policy.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <UserCheck size={24} color="#9261E5" />
                                <CardTitle>2. Eligibility</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p><strong>You must be at least 13 years old to use Voxxy.</strong> By creating an account or using our services, you confirm that you meet this age requirement. If you are under 13, you may not use Voxxy without parental consent.</p>
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
                                <p>All content on Voxxy, including designs, code, logos, and copy, belongs to Voxxy AI, Inc.. You may not copy or reuse it without permission.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Code size={24} color="#9261E5" />
                                <CardTitle>6. AI Services & Content Generation</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>Voxxy uses AI services (including OpenAI) to generate recommendations. You retain rights to your submitted data, but Voxxy and its AI providers may process it for recommendations and improvements.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CloudOff size={24} color="#9261E5" />
                                <CardTitle>7. Availability</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>We're constantly improving. We may change or remove features at any time without notice. We're not responsible for downtime.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <AlertTriangle size={24} color="#9261E5" />
                                <CardTitle>8. Liability Disclaimer</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>VOXXY IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY DELAWARE LAW:</p>
                                <ul>
                                    <li>We disclaim all warranties, express or implied</li>
                                    <li>We're not liable for any indirect, incidental, special, or consequential damages</li>
                                    <li>Our total liability will not exceed $100 or the amount you've paid us in the past 12 months, whichever is greater</li>
                                    <li>We're not responsible for third-party services, venues, or recommendations</li>
                                </ul>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Power size={24} color="#9261E5" />
                                <CardTitle>9. Termination</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>We may suspend or terminate your account for any violations of these terms.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Gavel size={24} color="#9261E5" />
                                <CardTitle>10. Governing Law</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>These Terms are governed by the laws of the State of Delaware, without regard to its conflict of law principles.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Shield size={24} color="#9261E5" />
                                <CardTitle>11. Indemnification</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>You agree to defend, indemnify, and hold Voxxy AI, Inc.., its officers, directors, employees, and agents harmless from any claims, damages, or expenses (including attorney's fees) arising from:</p>
                                <ul>
                                    <li>Your violation of these Terms</li>
                                    <li>Your use of the service</li>
                                    <li>Content you submit through Voxxy</li>
                                    <li>Your violation of any law or third-party rights</li>
                                </ul>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CreditCard size={24} color="#9261E5" />
                                <CardTitle>12. Payment Terms</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>If we introduce paid features:</p>
                                <ul>
                                    <li>All fees are non-refundable unless required by law</li>
                                    <li>We may change prices with 30 days notice</li>
                                    <li>You're responsible for all applicable taxes</li>
                                    <li>Failure to pay may result in service termination</li>
                                </ul>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <MessageSquare size={24} color="#9261E5" />
                                <CardTitle>13. Dispute Resolution</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p><strong>PLEASE READ CAREFULLY:</strong> Any disputes will be resolved through binding arbitration in Delaware, not in court. You waive your right to a jury trial and class actions. This doesn't affect your rights to file complaints with government agencies.</p>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <AlertCircle size={24} color="#9261E5" />
                                <CardTitle>14. User Content</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>When you submit content to Voxxy:</p>
                                <ul>
                                    <li>You retain ownership of your content</li>
                                    <li>You grant us a worldwide, royalty-free license to use, modify, and display it for operating Voxxy</li>
                                    <li>You confirm you have the right to share this content</li>
                                    <li>We may remove content that violates these terms</li>
                                </ul>
                            </CardDescription>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Mail size={24} color="#9261E5" />
                                <CardTitle>15. Contact</CardTitle>
                            </CardHeader>
                            <CardDescription>
                                <p>Have questions? Contact us at:</p>
                                <p>Voxxy AI, Inc.<br />
                                    Email: <a href="mailto:team@voxxyai.com" style={{ color: '#9261E5' }}>team@voxxyai.com</a><br />
                                </p>
                            </CardDescription>
                        </Card>
                    </CardsContainer>
                </Container>
            </Section>
            <Footer />
        </>
    );
}
