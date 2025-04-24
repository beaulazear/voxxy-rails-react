import React, { useEffect } from 'react';
import styled from 'styled-components';
import { FileText, UserCheck, Share2, Cookie, Shield, User, UserX, RefreshCcw } from 'lucide-react';
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

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Section>
        <Container>
          <Title>Privacy Policy</Title>
          <SubTitle>Effective Date: 4/23/2025 | Last Updated: 4/23/2025</SubTitle>
          <IntroWrapper>
            <Bar />
            <IntroText>
              At Voxxy, your privacy matters. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
            </IntroText>
          </IntroWrapper>

          <CardsContainer>
            <Card>
              <CardHeader>
                <FileText size={24} color="#9261E5" />
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardDescription>
                <ul>
                  <li><strong>Personal Info:</strong> Name, email address, and any optional profile details you provide.</li>
                  <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent, and actions taken on the site.</li>
                  <li><strong>Group Planning Preferences:</strong> Responses to Voxxy's quizzes, polls, and feedback tools.</li>
                  <li><strong>Communications:</strong> Feedback or inquiries submitted through our contact forms.</li>
                </ul>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <UserCheck size={24} color="#9261E5" />
                <CardTitle>How We Use Your Data</CardTitle>
              </CardHeader>
              <CardDescription>
                <ul>
                  <li>Provide and personalize your Voxxy experience</li>
                  <li>Improve our product through analytics and feedback</li>
                  <li>Send updates, surveys, and support messages</li>
                  <li>Prevent fraud or abuse</li>
                </ul>
                <p>We never sell your personal data.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <Share2 size={24} color="#9261E5" />
                <CardTitle>Data Sharing</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>We only share your data with trusted third parties that help us operate, including:</p>
                <ul>
                  <li>AWS (Hosting providers)</li>
                  <li>Mixpanel (Analytics tools)</li>
                  <li>SendGrid (Email tools)</li>
                </ul>
                <p>These partners follow strict data protection practices.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <Cookie size={24} color="#9261E5" />
                <CardTitle>Cookies & Tracking</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>We use cookies and similar technologies to remember your preferences and understand user behavior. You can manage cookie settings in your browser.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <Shield size={24} color="#9261E5" />
                <CardTitle>Data Security</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>We use encryption and secure storage to keep your data safe. While we do our best, no internet-based service is 100% secure.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <User size={24} color="#9261E5" />
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardDescription>
                <ul>
                  <li>Access or update your data</li>
                  <li>Request account deletion</li>
                  <li>Opt out of marketing communications</li>
                </ul>
                <p>Contact us anytime at <a href="mailto:team@voxxyai.com" style={{ color: '#9261E5' }}>team@voxxyai.com</a> to exercise these rights.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <UserX size={24} color="#9261E5" />
                <CardTitle>Children's Privacy</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>Voxxy AI is not designed for children under 13. We don't knowingly collect information from children.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <RefreshCcw size={24} color="#9261E5" />
                <CardTitle>Policy Updates</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>We may update this policy over time. If we make material changes, we'll notify you via email or on our site.</p>
              </CardDescription>
            </Card>
          </CardsContainer>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
