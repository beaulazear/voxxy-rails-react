import React, { useState, useEffect } from "react";
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, X } from 'lucide-react';
import Footer from './Footer';
import colors from '../styles/Colors';
import TryVoxxyChat from './TryVoxxyChat';
import RestaurantMap from "../admincomponents/RestaurantMap";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${colors.background};
  display: flex;
  flex-direction: column;
`;
const Main = styled.main`
  flex-grow: 1;
  padding-top: 6rem;
  padding-bottom: 4rem;
`;
const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
`;

// Title
const TitleSection = styled.div`
 padding: 0px;
 margin-bottom: 3rem;
 animation: ${fadeIn} 0.8s ease-out;
 `;
const Title = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: white;
  letter-spacing: -0.5px;
`;
const GradientText = styled.span`
  background: linear-gradient(135deg, ${colors.gradient.start}, ${colors.hoverHighlight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
const Description = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: ${colors.textSecondary};
  max-width: 40rem;
  margin: 0 auto 2rem;
  line-height: 1.6;
`;

// Card for planning
const CardWrapper = styled.div` 
  max-width: 28rem; 
  margin: 0 auto 4rem;
  animation: ${fadeIn} 0.8s ease-out 0.2s both;
`;
const Card = styled.div`
  background-color: ${colors.cardBackground};
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex; 
  flex-direction: column;
  border: 1px solid rgba(162, 89, 255, 0.1);
  
  &:hover { 
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(162, 89, 255, 0.3);
    border-color: rgba(162, 89, 255, 0.3);
  }
`;
const IconWrapper = styled.div`
  background: linear-gradient(135deg, rgba(162, 89, 255, 0.1), rgba(233, 62, 255, 0.1));
  border-radius: 50%; 
  width: 4rem; 
  height: 4rem;
  display: flex; 
  align-items: center; 
  justify-content: center;
  margin: 0 auto 1.5rem;
`;
const CardTitle = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 1rem;
`;
const CardText = styled.p`
  font-family: 'Inter', sans-serif;
  color: ${colors.textSecondary};
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;
const StyledLink = styled(Link)`
  display: inline-flex; 
  justify-content: center; 
  align-items: center;
  background: linear-gradient(135deg, ${colors.purple1}, ${colors.primaryButton});
  color: ${colors.textPrimary};
  padding: 0.875rem 1.75rem; 
  border-radius: 50px;
  text-decoration: none; 
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(162, 89, 255, 0.2);
  
  &:hover { 
    background: linear-gradient(135deg, ${colors.primaryButton}, ${colors.hoverHighlight});
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(162, 89, 255, 0.4);
  }
`;

// Recommendations list
const RecommendationsList = styled.ul`
  list-style: none;
  padding: 0;
  max-width: 40rem;
  margin: 0 auto 4rem;
  animation: ${fadeIn} 0.8s ease-out 0.3s both;
`;
const ListItem = styled.li`
  background: ${colors.cardBackground};
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-radius: 1rem;
  display: flex; 
  flex-direction: column;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  
  &:hover { 
    background: ${colors.cardBackground};
    border-color: rgba(162, 89, 255, 0.3);
    transform: translateX(4px);
    box-shadow: 0 4px 15px rgba(162, 89, 255, 0.2);
  }
`;
const ListTop = styled.div`
  display: flex; justify-content: space-between; align-items: center;
`;
const ListName = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  color: ${colors.textPrimary};
`;
const ListMeta = styled.span`
  font-size: 0.875rem;
  color: ${colors.textSecondary};
`;
const ListBottom = styled.div`
  margin-top: 0.5rem;
  color: ${colors.textSecondary};
  font-size: 0.875rem;
  text-align: left;
`;

// Modal for details and signup
const Overlay = styled.div`
  position: fixed; 
  inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(5px);
  display: flex; 
  align-items: center; 
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease-out;
`;
const Modal = styled.div`
  background: ${colors.cardBackground};
  padding: 2.5rem;
  border-radius: 1.5rem;
  width: 90%; 
  max-width: 400px;
  position: relative;
  color: white;
  border: 1px solid rgba(162, 89, 255, 0.1);
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  animation: ${fadeIn} 0.3s ease-out;
`;
const CloseButton = styled.button`
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; cursor: pointer;
  color: ${colors.textSecondary};
`;

const DetailModalContent = styled(Modal)`
 max-width: 500px; 
 text-align: left;
 `;
const PhotoGallery = styled.div`
  display: flex; overflow-x: auto; gap: 0.5rem; margin-bottom: 1rem;
`;
const Photo = styled.img`
  height: 80px; border-radius: 0.5rem;
`;
const DetailTitle = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;
const DetailText = styled.p`
  font-family: 'Inter', sans-serif;
  margin-bottom: 0.75rem;
  color: ${colors.textSecondary};
  line-height: 1.5;
`;
const DetailLink = styled.a`
  display: inline-block; 
  margin-bottom: 0.75rem;
  color: ${colors.gradient.start}; 
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${colors.hoverHighlight};
    text-decoration: underline;
  }
`;
// CTA Section
const CTASection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  animation: ${fadeIn} 0.8s ease-out 0.4s both;
`;
const CTAHeading = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 1.5rem;
`;
const CTAButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;
const CTAButton = styled(Link)`
  display: inline-block;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  text-decoration: none;
  background: linear-gradient(135deg, ${colors.purple1}, ${colors.primaryButton});
  color: ${colors.textPrimary};
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(162, 89, 255, 0.2);

  &:hover {
    background: linear-gradient(135deg, ${colors.primaryButton}, ${colors.hoverHighlight});
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(162, 89, 255, 0.4);
  }
`;

const ActionsWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

export default function TryVoxxy() {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingCache, setLoadingCache] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const getOrCreateSessionToken = () => {
    let token = localStorage.getItem('voxxy_token');
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem('voxxy_token', token);
    }
    return token;
  };

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    const token = getOrCreateSessionToken();
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/try_voxxy_cached?session_token=${token}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setRecommendations(data.recommendations || []))
      .catch(() => { })
      .finally(() => setLoadingCache(false));
  }, []);

  const openChat = () => {
    if (process.env.NODE_ENV === 'production') {
      fetch('/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({
          event: 'Try Voxxy Clicked',
          properties: {}
        }),
        credentials: 'include'
      }).catch(err => console.error('Analytics tracking failed:', err));
    }
    setChatOpen(true);
  }

  const handleChatClose = () => setChatOpen(false);
  const handleChatComplete = recs => setRecommendations(recs);

  const openDetail = rec => { setSelectedRec(rec); setShowDetailModal(true); };
  const closeDetail = () => { setShowDetailModal(false); setSelectedRec(null); };

  return (
    <PageContainer>
      <Main><Container>
        <TitleSection>
          <Title>Try <GradientText>Voxxy</GradientText> Today</Title>
          {recommendations.length > 0 ? (
            <Description>Below are your recommendations, click on one to see more details. Signup to save these recommendations and plan with your friends!</Description>
          ) : (
            <Description>Take a quick quiz to get recommendations on the perfect spot for your group meals.</Description>
          )}
        </TitleSection>

        {recommendations.length > 0 && (
          <ActionsWrapper>
            <RestaurantMap recommendations={recommendations} />
          </ActionsWrapper>
        )}

        {recommendations.length > 0 ? (
          <RecommendationsList>
            {recommendations.map((r, i) => (
              <ListItem key={i} onClick={() => openDetail(r)}>
                <ListTop>
                  <ListName>{r.name}</ListName>
                  <ListMeta>{r.price_range}</ListMeta>
                </ListTop>
                <ListBottom>
                  <div>{r.hours}</div>
                  <div>{r.address}</div>
                </ListBottom>
              </ListItem>
            ))}
          </RecommendationsList>
        ) : (!loadingCache && (
          <CardWrapper><Card onClick={openChat}>
            <IconWrapper><Calendar size={24} color={colors.primaryButton} /></IconWrapper>
            <CardTitle>Plan a Group Visit</CardTitle>
            <CardText>Find the perfect restaurant for your group.</CardText>
            <StyledLink as="div">Try Restaurant Planning <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} /></StyledLink>
          </Card></CardWrapper>
        ))}

        <CTASection>
          <CTAHeading>Ready to get started?</CTAHeading>
          <CTAButtons>
            <CTAButton to="/signup">Create Your Account</CTAButton>
          </CTAButtons>
        </CTASection>

      </Container></Main>
      <Footer />

      {chatOpen && (
        <TryVoxxyChat
          onClose={handleChatClose}
          onChatComplete={recs => {
            handleChatComplete(recs);
            handleChatClose();
          }}
        />
      )}

      {showDetailModal && selectedRec && (
        <Overlay onClick={closeDetail}><DetailModalContent onClick={e => e.stopPropagation()}>
          <CloseButton onClick={closeDetail}><X size={20} color={colors.textSecondary} /></CloseButton>
          <DetailTitle>{selectedRec.name}</DetailTitle>
          <DetailText><strong>Price:</strong> {selectedRec.price_range}</DetailText>
          <DetailText><strong>Hours:</strong> {selectedRec.hours}</DetailText>
          <DetailText>{selectedRec.description}</DetailText>
          <DetailText><strong>Why:</strong> {selectedRec.reason}</DetailText>
          {selectedRec.website && <DetailLink href={selectedRec.website} target="_blank">Visit Website</DetailLink>}
          <DetailText><strong>Address:</strong> {selectedRec.address}</DetailText>
          <PhotoGallery>{(selectedRec.photos || []).map((url, i) => <Photo key={i} src={url.photo_reference ? `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/places/photo/${url.photo_reference}?max_width=400` : url} />)}</PhotoGallery>
        </DetailModalContent></Overlay>
      )}

      {showSignupModal && (
        <Overlay onClick={() => setShowSignupModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowSignupModal(false)}><X size={20} /></CloseButton>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Sign Up to Unlock More</h3>
            <p style={{ color: colors.textSecondary, marginBottom: '1.5rem' }}>
              You've reached your free limit. Create a Voxxy account to generate more recommendations, invite friends, and save your picks!
            </p>
            <CTAButton to="/signup">Create an Account</CTAButton>
          </Modal>
        </Overlay>
      )}

    </PageContainer>
  );
}