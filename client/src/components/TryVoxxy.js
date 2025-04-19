import React, { useState, useEffect } from "react";
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, X } from 'lucide-react';
import Footer from './Footer';
import colors from '../styles/Colors';
import TryVoxxyChat from './TryVoxxyChat';

// Layout
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
 `;
const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: white;
  @media (min-width: 640px) { font-size: 3.125rem; }
`;
const GradientText = styled.span`
  background: linear-gradient(90deg, #B931D6 0%, #9051E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
const Description = styled.p`
  font-size: 1.125rem;
  color: ${colors.textSecondary};
  max-width: 40rem;
  margin: 0 auto 2rem;
`;

// Card for planning
const CardWrapper = styled.div` max-width: 28rem; margin: 0 auto 4rem; `;
const Card = styled.div`
  background-color: ${colors.cardBackground};
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: box-shadow 0.2s;
  display: flex; flex-direction: column;
  &:hover { box-shadow: 0 0 20px #592566; }
`;
const IconWrapper = styled.div`
  background-color: rgba(157,96,248,0.1);
  border-radius: 50%; width: 3rem; height: 3rem;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
`;
const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 1rem;
`;
const CardText = styled.p`
  color: ${colors.textSecondary};
  margin-bottom: 1.5rem;
`;
const StyledLink = styled(Link)`
  display: flex; justify-content: center; align-items: center;
  background-color: ${colors.primaryButton};
  color: ${colors.textPrimary};
  padding: 0.75rem; border-radius: 9999px;
  text-decoration: none; font-weight: 600;
  transition: background-color 0.2s;
  &:hover { background-color: rgba(157,96,248,0.9); }
`;

// Recommendations list
const RecommendationsList = styled.ul`
  list-style: none;
  padding: 0;
  max-width: 40rem;
  margin: 0 auto 4rem;
`;
const ListItem = styled.li`
  background: ${colors.cardBackground};
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  display: flex; flex-direction: column;
  cursor: pointer;
  &:hover { background: rgba(157,96,248,0.1); }
`;
const ListTop = styled.div`
  display: flex; justify-content: space-between; align-items: center;
`;
const ListName = styled.span`
  font-weight: 600;
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

// Plan Modal
const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
`;
const Modal = styled.div`
  background: ${colors.cardBackground};
  padding: 2rem;
  border-radius: 1rem;
  width: 90%; max-width: 400px;
  position: relative;
  color: white;
`;
const CloseButton = styled.button`
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; cursor: pointer;
  color: ${colors.textSecondary};
`;
const Input = styled.input`
  width: 100%; padding: 0.75rem; margin-bottom: 1rem;
  background: ${colors.backgroundTwo};
  color: white;
  border: 1px solid ${colors.lightBorder};
  border-radius: 0.5rem;
`;
const Select = styled.select`
  width: 100%; padding: 0.75rem; margin-bottom: 1rem;
  background: ${colors.backgroundTwo};
  color: white;
  border: 1px solid ${colors.lightBorder};
  border-radius: 0.5rem;
`;
const Button = styled.button`
  background: ${colors.primaryButton};
  color: #fff;
  padding: 0.75rem 1rem;
  border: none; border-radius: 9999px;
  font-weight: 600; cursor: pointer;
  margin-right: 0.5rem;
  &:hover { background: rgba(157,96,248,0.9); }
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
  margin-bottom: 0.5rem;
  color: ${colors.textPrimary};
`;
const DetailText = styled.p`
  margin-bottom: 0.75rem;
  color: ${colors.textSecondary};
`;
const DetailLink = styled.a`
  display: inline-block; margin-bottom: 0.75rem;
  color: ${colors.primaryButton}; text-decoration: underline;
`;
// CTA Section
const CTASection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;
const CTAHeading = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
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
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  text-decoration: none;
  background-color: ${colors.primaryButton};
  color: ${colors.textPrimary};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(157,96,248,0.9);
  }
`;

export default function TryVoxxy() {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingCache, setLoadingCache] = useState(true);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [eventLocation, setEventLocation] = useState('');
  const [dateNotes, setDateNotes] = useState('');

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  console.log(recommendations)

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/try_voxxy_cached`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setRecommendations(data.recommendations || []))
      .catch(() => { })
      .finally(() => setLoadingCache(false));
  }, []);

  const openPlan = () => setShowPlanModal(true);
  const closePlan = () => setShowPlanModal(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setEventLocation(`${coords.latitude},${coords.longitude}`);
      setFetchingLocation(false);
    }, () => {
      setFetchingLocation(false);
      alert("Unable to fetch location");
    });
  };

  const submitPlan = () => {
    if (!eventLocation.trim() || !dateNotes) return;
    setShowPlanModal(false);
    setChatOpen(true);
  };

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
          <div style={{ marginBottom: '2rem' }}>
            <Button onClick={() => setShowSignupModal(true)}>
              Refresh Choices
            </Button>
          </div>
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
          <CardWrapper><Card onClick={openPlan}>
            <IconWrapper><Calendar size={24} color={colors.primaryButton} /></IconWrapper>
            <CardTitle>Plan a Group Visit</CardTitle>
            <CardText>Find the perfect restaurant for your group.</CardText>
            <StyledLink as="div">Try Restaurant Planning <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} /></StyledLink>
          </Card></CardWrapper>
        ))}

        {/* CTA Section */}
        <CTASection>
          <CTAHeading>Ready to get started?</CTAHeading>
          <CTAButtons>
            <CTAButton to="/signup">Create Your Account</CTAButton>
          </CTAButtons>
        </CTASection>

      </Container></Main>
      <Footer />

      {showPlanModal && (
        <Overlay onClick={closePlan}><Modal onClick={e => e.stopPropagation()}>
          <CloseButton onClick={closePlan}><X size={20} /></CloseButton>
          <h3 style={{ color: 'white', marginBottom: '1.25rem' }}>Enter Event Details</h3>

          <Input placeholder="Location" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Button onClick={useCurrentLocation}>Use Current Location</Button>
            {fetchingLocation && <span style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>Fetching location...</span>}
          </div>

          <Select value={dateNotes} onChange={e => setDateNotes(e.target.value)}>
            <option value="" disabled>Select outing type</option>
            <option value="Brunch">Brunch</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Late-night drinks">Late-night drinks</option>
          </Select>

          <div style={{ textAlign: 'right' }}>
            <Button onClick={submitPlan}>Continue</Button>
          </div>
        </Modal></Overlay>
      )}

      {chatOpen && <TryVoxxyChat eventLocation={eventLocation} dateNotes={dateNotes} onClose={handleChatClose} onChatComplete={recs => { handleChatComplete(recs); handleChatClose(); }} />}

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
          <PhotoGallery>{(selectedRec.photos || []).map((url, i) => <Photo key={i} src={url.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${url.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}` : url} />)}</PhotoGallery>
        </DetailModalContent></Overlay>
      )}

      {showSignupModal && (
        <Overlay onClick={() => setShowSignupModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowSignupModal(false)}><X size={20} /></CloseButton>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Sign Up to Unlock More</h3>
            <p style={{ color: colors.textSecondary, marginBottom: '1.5rem' }}>
              You’ve reached your free limit. Create a Voxxy account to generate more recommendations, invite friends, and save your picks!
            </p>
            <CTAButton to="/signup">Create an Account</CTAButton>
          </Modal>
        </Overlay>
      )}

    </PageContainer>
  );
}
