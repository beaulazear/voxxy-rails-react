import React from "react";
import styled from "styled-components";
import { MapPinCheck, Clock, Star } from "lucide-react";

const Wrapper = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  text-align: left;
`;

const Card = styled.div`
  background: #2C1E33;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  margin: 0;
  color: #fff;
  text-align: left;
`;

const Badge = styled.div`
  background: #8F51E0;
  padding: 0.5rem 1rem;
  width: fit-content;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  color: #fff;
  text-align: center;
  margin: 0 auto;
  margin-bottom: 2rem;
`;

const Description = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: #fff;
  margin-bottom: 1rem;
`;

const Reason = styled.p`
  font-size: 0.9rem;
  font-style: italic;
  color: #ddd;
  margin-bottom: 1.5rem;
`;

const Details = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem 0;
  color: #fff;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding-top: 1rem;

  img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
`;

export default function SelectedPinnedActivity({ pinned }) {
  return (
    <Wrapper>
        <Badge>Selected Restaurant</Badge>
        <Card>
        <Header>
          <Title>{pinned.title}</Title>
        </Header>

        <Description>{pinned.description}</Description>

        {pinned.reason && <Reason>Reason picked: {pinned.reason}</Reason>}

        <Details>
          <DetailItem><Clock size={16} /> {pinned.hours || "N/A"}</DetailItem>
          <DetailItem><MapPinCheck size={16} /> {pinned.address || "N/A"}</DetailItem>
          <DetailItem>{pinned.price_range || "N/A"}</DetailItem>
          {pinned.website && (
            <DetailItem>
              <Star size={16} />
              <a
                href={pinned.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#fff', textDecoration: 'underline' }}
              >
                Visit Site
              </a>
            </DetailItem>
          )}
        </Details>

        {pinned.photos && pinned.photos.length > 0 && (
          <PhotoGrid>
            {pinned.photos.slice(0, 3).map((photo, idx) => (
              <img
                key={idx}
                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`}
                alt={`${pinned.title} ${idx + 1}`}
              />
            ))}
          </PhotoGrid>
        )}
      </Card>
    </Wrapper>
  );
}
