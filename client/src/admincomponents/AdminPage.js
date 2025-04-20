import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors';

const AdminHero = styled.section`
  background-color: ${colors.background};
  color: ${colors.textPrimary};
  text-align: center;
  padding: 6rem 1.5rem;
  padding-top: 120px;
  box-sizing: border-box;
`;

const AdminHeroContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const AdminTitle = styled(Heading1)`
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;

const AdminSubtitle = styled(MutedText)`
  font-size: 1.125rem;
  color: ${colors.textMuted};
  max-width: 700px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
`;

// Section for listing waitlist entries
const ListSection = styled.section`
  background-color: ${colors.cardBackground || colors.card};
  padding: 2rem 1.5rem;
`;

const ListContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const ListItem = styled.div`
  background-color: ${colors.card};
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: left;

  h3 {
    margin: 0;
    margin-bottom: 0.5rem;
    color: ${colors.textPrimary};
  }

  p {
    margin: 0.25rem 0;
    color: ${colors.textMuted};
    font-size: 0.95rem;
  }
`;

export default function AdminPage() {
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    fetch(`${API_URL}/waitlists`, {
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Fetch error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const cutoff = new Date('2025-04-01');
        const filtered = data.filter(entry => new Date(entry.created_at) >= cutoff);
        setWaitlists(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <AdminHero>
        <AdminHeroContainer>
          <AdminTitle>Welcome to the <GradientText>Admin Dashboard</GradientText></AdminTitle>
          <AdminSubtitle>
            Here you can review and manage all waitlist entries. Get insights at a glance and take action as needed.
          </AdminSubtitle>
        </AdminHeroContainer>
      </AdminHero>

      <ListSection>
        <ListContainer>
          {loading && <MutedText>Loading waitlist...</MutedText>}
          {error && <MutedText>Error: {error}</MutedText>}
          {!loading && !error && waitlists.length === 0 && (
            <MutedText>No waitlist entries found.</MutedText>
          )}
          {!loading && !error && waitlists.map(entry => (
            <ListItem key={entry.id}>
              <h3>{entry.name}</h3>
              <p>Email: {entry.email}</p>
              <p>Product Opt-in: {entry.product ? 'Yes' : 'No'}</p>
              <p>Mobile Opt-in: {entry.mobile ? 'Yes' : 'No'}</p>
              <p>Requested At: {new Date(entry.created_at).toLocaleString()}</p>
            </ListItem>
          ))}
        </ListContainer>
      </ListSection>
    </>
  );
}

const GradientText = styled.span`
  background: linear-gradient(90deg, #B931D6 0%, #9051E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
