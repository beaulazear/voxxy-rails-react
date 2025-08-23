import React, { useEffect } from 'react';
import styled from 'styled-components';
import { FileText, UserCheck, Share2, Cookie, Shield, User, UserX, RefreshCcw, MapPin, Smartphone, Globe, DollarSign, Clock } from 'lucide-react';
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

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Section>
        <Container>
          <Title>Privacy Policy</Title>
          <SubTitle>Effective Date: 4/23/2025 | Last Updated: 8/23/2025</SubTitle>
          <IntroWrapper>
            <Bar />
            <IntroText>
              At Voxxy, your privacy matters. This Privacy Policy explains how we collect, use, and protect your information when you use our website and mobile app.
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
                  <li><strong>Guest Users:</strong> We may collect your email if you participate in polls or activity boards without registering.</li>
                  <li><strong>Product Interaction Data:</strong> How you interact with app features, including activities created, votes cast, preferences selected, and navigation patterns within the app.</li>
                  <li><strong>Usage & Device Data:</strong> IP address, browser type, device type, operating system, pages visited, time spent, and actions taken in the app.</li>
                  <li><strong>Location Data:</strong> City-level and precise location (when enabled) to recommend events and activities.</li>
                  <li><strong>Contacts:</strong> When you grant permission, we access your device contacts solely to help you find friends already using Voxxy. We do not store your full contact list.</li>
                  <li><strong>Diagnostics:</strong> Crash logs and performance data to improve app stability and fix technical issues. This data is collected anonymously.</li>
                  <li><strong>Push Notifications:</strong> Push notification tokens for sending alerts and updates.</li>
                  <li><strong>Group Planning Preferences:</strong> Responses to Voxxy quizzes, polls, votes, and feedback tools.</li>
                  <li><strong>Activity Preferences:</strong> Event preferences used for AI recommendations.</li>
                  <li><strong>Communications:</strong> Feedback, support requests, and messages submitted through our contact forms.</li>
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
                  <li>Generate AI-driven recommendations for events and activities</li>
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
                  <li>Google Places API (Venue information and location services)</li>
                  <li>Mixpanel (Analytics tools)</li>
                  <li>SendGrid (Email tools)</li>
                  <li>OpenAI (AI-powered recommendations)</li>
                </ul>
                <p>When you use Voxxy's recommendation features, we send your activity preferences, location, and group responses to OpenAI to generate personalized restaurant, bar, and activity suggestions. Some anonymized data may be sent to OpenAI for processing. These partners follow strict data protection practices.</p>
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
                <Clock size={24} color="#9261E5" />
                <CardTitle>Data Retention</CardTitle>
              </CardHeader>
              <CardDescription>
                <ul>
                  <li><strong>Personal account data:</strong> Retained until you request deletion</li>
                  <li><strong>Guest user emails:</strong> Deleted after 12 months if inactive</li>
                  <li><strong>Poll and planning data:</strong> Retained for 18 months for analytics</li>
                  <li><strong>Push notification tokens:</strong> Deleted after 90 days of inactivity</li>
                </ul>
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
                <CardTitle>Children's Privacy & Age Verification</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>Voxxy is not designed for children under 13. We verify age during registration and may require parental consent where applicable. We don't knowingly collect information from children. If we discover that a child under 13 has provided us with personal information, we will delete it immediately. If you believe we have collected information from a child under 13, please contact us.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <MapPin size={24} color="#9261E5" />
                <CardTitle>Location Data</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>When you create or respond to activities, we collect location information to provide recommendations near your chosen meeting spot. This data is used solely for providing our services and is not sold or used for advertising. You can choose not to provide location data, but this may limit our recommendation features.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone size={24} color="#9261E5" />
                <CardTitle>Mobile App Permissions</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>Our mobile app may request the following permissions:</p>
                <ul>
                  <li><strong>Push Notifications:</strong> To send you activity updates and reminders (optional)</li>
                  <li><strong>Camera/Photos:</strong> To upload profile pictures (optional)</li>
                  <li><strong>Contacts:</strong> To help you find friends already using Voxxy (optional)</li>
                  <li><strong>Location:</strong> To provide venue recommendations near you (optional)</li>
                </ul>
                <p>You can manage these permissions in your device settings at any time.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <Shield size={24} color="#9261E5" />
                <CardTitle>Data Linking & Anonymity</CardTitle>
              </CardHeader>
              <CardDescription>
                <p><strong>Data linked to your identity:</strong></p>
                <ul>
                  <li>Name and email address</li>
                  <li>Profile photos</li>
                  <li>Location history and activity locations</li>
                  <li>Activities created and participated in</li>
                  <li>Votes, preferences, and interactions</li>
                  <li>Comments and messages</li>
                </ul>
                <p><strong>Data NOT linked to your identity:</strong></p>
                <ul>
                  <li>Contacts (used only for friend matching, not stored)</li>
                  <li>Crash logs and diagnostic data (collected anonymously)</li>
                </ul>
                <p>We do not use any of your data for tracking across other companies' apps or websites.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <Globe size={24} color="#9261E5" />
                <CardTitle>International Users</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>Voxxy is operated from the United States. If you use our services from outside the US, your data will be transferred to and processed in the US. By using Voxxy, you consent to this transfer.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign size={24} color="#9261E5" />
                <CardTitle>California Privacy Rights</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>California residents have additional rights under the CCPA:</p>
                <ul>
                  <li>Right to know what personal information we collect</li>
                  <li>Right to delete your personal information</li>
                  <li>Right to opt-out of data sales (we don't sell your data)</li>
                  <li>Right to non-discrimination for exercising your rights</li>
                </ul>
                <p>To exercise these rights, contact us at team@voxxyai.com.</p>
              </CardDescription>
            </Card>

            <Card>
              <CardHeader>
                <RefreshCcw size={24} color="#9261E5" />
                <CardTitle>Policy Updates</CardTitle>
              </CardHeader>
              <CardDescription>
                <p>We may update this policy over time. If we make material changes, we'll notify you via email or on our site. Your continued use of Voxxy after changes means you accept the updated policy.</p>
              </CardDescription>
            </Card>
          </CardsContainer>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
