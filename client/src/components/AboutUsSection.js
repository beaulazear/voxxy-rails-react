import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Target, Heart, Sparkles } from 'lucide-react';
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
  margin-bottom: 2rem;
  font-weight: 700;
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

const CardDescription = styled.p`
  color: ${colors.textPrimary};
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1rem;
  text-align: left;
`;

export default function AboutUsPage() {

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Section>
        <Container>
          <Title>About Us</Title>
          <IntroWrapper>
            <Bar />
            <IntroText>
              At Voxxy, we believe that connection is everything. We're here to make group planning simpler, faster, and even a little fun. Whether it's a family reunion, a friend getaway, or a work retreat, planning can quickly become chaotic, leading to frustration, confusion, and endless group chats. Our goal is to take that stress off your shoulders, so you can focus on the fun parts—spending time together and creating memories that last.
            </IntroText>
          </IntroWrapper>
          <CardsContainer>
            <Card>
              <CardHeader>
                <Target size={24} color={'#9261E5'} />
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardDescription>
                At Voxxy, we're on a mission to fight the loneliness epidemic one group plan at a time. We understand that life's better when we're connected, and we believe that planning shouldn't get in the way of that. We use AI to help people coordinate with ease, streamline decision-making, and make group activities a breeze. Because when we come together—whether it's for work, play, or anything in between—life gets a little brighter.
              </CardDescription>
            </Card>
            <Card>
              <CardHeader>
                <Heart size={24} color={'#9261E5'} />
                <CardTitle>Why Voxxy Exists</CardTitle>
              </CardHeader>
              <CardDescription>
                Voxxy was born out of frustration—like, "How did we end up with 50 different restaurant suggestions and no plans yet?" Sound familiar? We realized that group planning doesn't have to be a headache. The process of getting friends, family, or colleagues on the same page is complicated enough without having to juggle endless messages, emails, and Google Docs. So, we built Voxxy to make it easy to create, share, vote on, and finalize plans—all in one place. No more endless back-and-forths. No more stress.
              </CardDescription>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles size={24} color={'#9261E5'} />
                <CardTitle>The Voxxy Vision</CardTitle>
              </CardHeader>
              <CardDescription>
                We're not just about better planning; we're about fostering real human connections. In today's world, where isolation is a real problem and the loneliness epidemic is growing, Voxxy exists to help people come together in meaningful ways. We want to make sure that planning doesn't drain your energy—it should energize you, create laughs, spark joy, and make getting together feel easy. Life's short, and we're here to make sure you spend less time planning and more time living.
              </CardDescription>
              <CardDescription>
                So, join us in creating a community of connection—because at Voxxy, we believe that the best memories are made when we're together. Now, let's make those plans!
              </CardDescription>
            </Card>
          </CardsContainer>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
