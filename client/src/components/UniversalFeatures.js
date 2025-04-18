import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { CalendarDays, MessageSquareText, CheckCircle, Vote } from "lucide-react";

const SectionWrapper = styled.section`
  background-color: #251C2C;
  padding: 4rem 2rem;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const SectionSubtitle = styled.p`
  font-size: 1rem;
  color: #bbbbbb;
  margin-bottom: 3rem;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
`;

const FeatureCard = styled.div`
  background-color: #2a1e30;
  border-radius: 1rem;
  padding: 2rem;
  flex: 1 1 250px;
  max-width: 300px;
  color: white;
  text-align: left;

  svg {
    color: #9D60F8;
    margin-bottom: 1rem;
  }

    &:hover {
      box-shadow: 0 0 20px #592566, 0 0 40px #592566;
    }
`;

const FeatureTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const FeatureText = styled.p`
  font-size: 0.95rem;
  color: #cccccc;
  line-height: 1.6;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CTAButton = styled(Link)`
  background: ${({ variant }) =>
        variant === "outline" ? "transparent" : "#cc31e8"};
  color: ${({ variant }) => (variant === "outline" ? "#fff" : "#fff")};
  border: ${({ variant }) => (variant === "outline" ? "1px solid #9D60F8" : "none")};
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.3s ease;

  &:hover {
    opacity: 0.85;
  }
`;

export default function UniversalFeatures() {
    return (
        <SectionWrapper>
            <SectionTitle>Features Across All Activities</SectionTitle>
            <SectionSubtitle>
                No matter what type of event you're planning, Voxxy provides these essential tools.
            </SectionSubtitle>

            <CardsContainer>
                <FeatureCard>
                    <CalendarDays size={28} />
                    <FeatureTitle>Smart Scheduling</FeatureTitle>
                    <FeatureText>
                        Find the perfect date and time that works for everyone with our AI-powered scheduling system.
                    </FeatureText>
                </FeatureCard>

                <FeatureCard>
                    <MessageSquareText size={28} />
                    <FeatureTitle>Integrated Messaging</FeatureTitle>
                    <FeatureText>
                        Keep all planning conversations in one place without jumping between apps.
                    </FeatureText>
                </FeatureCard>

                <FeatureCard>
                    <CheckCircle size={28} />
                    <FeatureTitle>Task Management</FeatureTitle>
                    <FeatureText>
                        Assign tasks to group members and track completion to ensure nothing falls through the cracks.
                    </FeatureText>
                </FeatureCard>

                <FeatureCard>
                    <Vote size={28} />
                    <FeatureTitle>Democratic Decision Making</FeatureTitle>
                    <FeatureText>
                        Built-in voting features ensure everyone's voice is heard when making group decisions.
                    </FeatureText>
                </FeatureCard>
            </CardsContainer>

            <h3 style={{ fontSize: "1.125rem", color: "#fff", marginBottom: "1rem" }}>
                Ready to simplify your group planning?
            </h3>

            <ButtonRow>
                <CTAButton to="/signup">Create Your Account</CTAButton>
                <CTAButton to="/try-voxxy" variant="outline">Try Voxxy First</CTAButton>
            </ButtonRow>
        </SectionWrapper>
    );
}