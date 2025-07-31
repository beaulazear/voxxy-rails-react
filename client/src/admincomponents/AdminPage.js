import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors';
import { Users, Star, Mail, Bug, BarChart3, Activity, UserCheck, Shield } from 'lucide-react';
import Footer from '../components/Footer'

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

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 1rem;
  background-color: ${colors.background};
  /* hide native scrollbar */
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button`
  flex: 0 0 auto;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ $active }) => $active ? colors.accent : 'transparent'};
  color: ${({ $active }) => $active ? colors.textPrimary : colors.textMuted};
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: ${colors.accent};
  }
`;

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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: left;
  h3 { margin: 0 0 0.5rem; color: ${colors.textPrimary}; }
  p { margin: 0.25rem 0; color: ${colors.textMuted}; font-size: 0.95rem; }
`;

const GradientText = styled.span`
  background: linear-gradient(90deg, #B931D6 0%, #9051E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const AnalyticsSection = styled.section`
  background-color: ${colors.background};
  padding: 2rem 1.5rem;
  border-bottom: 1px solid ${colors.cardBackground};
`;

const AnalyticsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const AnalyticsTitle = styled.h2`
  color: ${colors.textPrimary};
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: ${colors.card};
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  
  .icon {
    margin: 0 auto 1rem;
    padding: 0.75rem;
    background-color: ${colors.accent}20;
    border-radius: 50%;
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .number {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.5rem;
  }
  
  .label {
    color: ${colors.textMuted};
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ActivityStatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatusCard = styled.div`
  background-color: ${colors.cardBackground};
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid ${props => props.color || colors.accent};
  
  .number {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${colors.textPrimary};
    margin-bottom: 0.25rem;
  }
  
  .label {
    color: ${colors.textMuted};
    font-size: 0.85rem;
  }
`;

export default function AdminDashboard() {
  const tabs = [
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'waitlists', label: 'Waitlists', icon: Users },
    { key: 'feedbacks', label: 'Feedbacks', icon: Star },
    { key: 'contacts', label: 'Contacts', icon: Mail },
    { key: 'bugs', label: 'Bug Reports', icon: Bug },
  ];

  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [waitlists, setWaitlists] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [adminUsers, setAdminUsers] = useState(null);

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${API}/admin/analytics`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Analytics: ${r.status}`)),
      fetch(`${API}/admin/admin_users`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Admin Users: ${r.status}`)),
      fetch(`${API}/waitlists`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Waitlists: ${r.status}`)),
      fetch(`${API}/feedbacks`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Feedbacks: ${r.status}`)),
      fetch(`${API}/contacts`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Contacts: ${r.status}`)),
      fetch(`${API}/bug_reports`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Bugs: ${r.status}`)),
    ])
      .then(([a, au, w, f, c, b]) => {
        setAnalytics(a);
        setAdminUsers(au);
        setWaitlists(w);
        setFeedbacks(f);
        setContacts(c);
        setBugs(b);
      })
      .catch(err => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  const dataMap = {
    waitlists,
    feedbacks,
    contacts,
    bugs,
  };
  let displayData = dataMap[activeTab] || [];
  if (activeTab === 'waitlists') {
    displayData = displayData.filter(item => {
      const created = new Date(item.created_at);
      return created >= new Date('2025-04-01');
    });
  }

  return (
    <>
      <AdminHero>
        <AdminHeroContainer>
          <AdminTitle>
            Admin Dashboard <GradientText>Overview</GradientText>
          </AdminTitle>
          <AdminSubtitle>
            Review and manage all submissions across waitlists, feedbacks, contacts, and bugs.
          </AdminSubtitle>
        </AdminHeroContainer>
      </AdminHero>

      <TabContainer>
        {tabs.map(({ key, label, icon: Icon }) => (
          <Tab
            key={key}
            $active={activeTab === key}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={20} /> {label}
          </Tab>
        ))}
      </TabContainer>

      {activeTab === 'analytics' && analytics && (
        <AnalyticsSection>
          <AnalyticsContainer>
            <AnalyticsTitle>Platform Analytics</AnalyticsTitle>
            
            <StatsGrid>
              <StatCard>
                <div className="icon">
                  <UserCheck size={24} color="white" />
                </div>
                <div className="number">{analytics.total_users}</div>
                <div className="label">Total Users</div>
              </StatCard>
              
              <StatCard>
                <div className="icon">
                  <Activity size={24} color="white" />
                </div>
                <div className="number">{analytics.total_activities}</div>
                <div className="label">Total Activities</div>
              </StatCard>
              
              {adminUsers && (
                <StatCard>
                  <div className="icon">
                    <Shield size={24} color="white" />
                  </div>
                  <div className="number">{adminUsers.total_admin_users}</div>
                  <div className="label">Admin Users</div>
                </StatCard>
              )}
            </StatsGrid>

            <AnalyticsTitle>Activity Status Breakdown</AnalyticsTitle>
            <ActivityStatusGrid>
              <StatusCard color="#22c55e">
                <div className="number">{analytics.activities_by_status.collecting}</div>
                <div className="label">Collecting Responses</div>
              </StatusCard>
              
              <StatusCard color="#f59e0b">
                <div className="number">{analytics.activities_by_status.voting}</div>
                <div className="label">In Voting Phase</div>
              </StatusCard>
              
              <StatusCard color="#3b82f6">
                <div className="number">{analytics.activities_by_status.finalized}</div>
                <div className="label">Finalized</div>
              </StatusCard>
              
              <StatusCard color="#6b7280">
                <div className="number">{analytics.activities_by_status.completed}</div>
                <div className="label">Completed</div>
              </StatusCard>
            </ActivityStatusGrid>

            {adminUsers && adminUsers.admin_users && adminUsers.admin_users.length > 0 && (
              <>
                <AnalyticsTitle>Admin Users</AnalyticsTitle>
                <ActivityStatusGrid>
                  {adminUsers.admin_users.map((user, index) => (
                    <StatusCard key={index} color={colors.accent}>
                      <div className="number">{user.name}</div>
                      <div className="label">{user.email}</div>
                    </StatusCard>
                  ))}
                </ActivityStatusGrid>
              </>
            )}
          </AnalyticsContainer>
        </AnalyticsSection>
      )}

      {activeTab !== 'analytics' && (
        <ListSection>
          <ListContainer>
            {loading && <MutedText>Loading all data...</MutedText>}
            {error && <MutedText>Error: {error}</MutedText>}
            {!loading && !error && displayData.length === 0 && (
              <MutedText>No entries found.</MutedText>
            )}
            {!loading && !error && displayData.map(item => (
              <ListItem key={item.id}>
                {Object.entries(item).map(([k, v]) => (
                  <p key={k}>
                    <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                  </p>
                ))}
              </ListItem>
            ))}
          </ListContainer>
        </ListSection>
      )}

      <Footer />
    </>
  );
}