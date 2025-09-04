import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors';
import { Users, Star, Mail, Bug, BarChart3, Activity, UserCheck, Shield, Flag, AlertTriangle, Clock, CheckCircle, XCircle, Ban, AlertCircle } from 'lucide-react';
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

// Moderation specific styles
const ModerationSection = styled.section`
  background-color: ${colors.cardBackground || colors.card};
  padding: 2rem 1.5rem;
`;

const ModerationContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ReportCard = styled.div`
  background-color: ${colors.card};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid ${props => 
    props.$overdue ? '#ef4444' : 
    props.$status === 'resolved' ? '#22c55e' :
    props.$status === 'reviewing' ? '#f59e0b' :
    '#3b82f6'
  };
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ReportInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const ReportActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: ${props => 
    props.$status === 'pending' ? '#dbeafe' :
    props.$status === 'reviewing' ? '#fef3c7' :
    props.$status === 'resolved' ? '#d1fae5' :
    '#fee2e2'
  };
  color: ${props => 
    props.$status === 'pending' ? '#1e40af' :
    props.$status === 'reviewing' ? '#92400e' :
    props.$status === 'resolved' ? '#065f46' :
    '#991b1b'
  };
`;

const OverdueBadge = styled(StatusBadge)`
  background-color: #fee2e2;
  color: #991b1b;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReviewButton = styled(ActionButton)`
  background-color: #3b82f6;
  color: white;
  &:hover { background-color: #2563eb; }
`;

const WarnButton = styled(ActionButton)`
  background-color: #f59e0b;
  color: white;
  &:hover { background-color: #d97706; }
`;

const SuspendButton = styled(ActionButton)`
  background-color: #ef4444;
  color: white;
  &:hover { background-color: #dc2626; }
`;

const BanButton = styled(ActionButton)`
  background-color: #991b1b;
  color: white;
  &:hover { background-color: #7f1d1d; }
`;

const DismissButton = styled(ActionButton)`
  background-color: #6b7280;
  color: white;
  &:hover { background-color: #4b5563; }
`;

const ReportDetail = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${colors.cardBackground};
  
  h4 {
    color: ${colors.textPrimary};
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  p {
    color: ${colors.textMuted};
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }
`;

const ModerationStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${colors.textMuted};
`;

export default function AdminDashboard() {
  const tabs = [
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'moderation', label: 'Moderation', icon: AlertTriangle },
    { key: 'waitlists', label: 'Waitlists', icon: Users },
    { key: 'feedbacks', label: 'Feedbacks', icon: Star },
    { key: 'contacts', label: 'Contacts', icon: Mail },
    { key: 'bugs', label: 'Bug Reports', icon: Bug },
    { key: 'flagged_restaurants', label: 'Flagged Restaurants', icon: Flag },
  ];

  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [waitlists, setWaitlists] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [flaggedRestaurants, setFlaggedRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [adminUsers, setAdminUsers] = useState(null);
  
  // Moderation state
  const [reports, setReports] = useState([]);
  const [moderationStats, setModerationStats] = useState(null);
  const [processingReport, setProcessingReport] = useState(null);

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
      fetch(`${API}/admin/flagged_restaurants`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Flagged Restaurants: ${r.status}`)),
      // Fetch moderation data
      fetch(`${API}/reports`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Reports: ${r.status}`)),
      fetch(`${API}/reports/stats`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject(`Moderation Stats: ${r.status}`)),
    ])
      .then(([a, au, w, f, c, b, fr, reportsData, stats]) => {
        setAnalytics(a);
        setAdminUsers(au);
        setWaitlists(w);
        setFeedbacks(f);
        setContacts(c);
        setBugs(b);
        setFlaggedRestaurants(fr.flagged_restaurants || []);
        setReports(reportsData.reports || []);
        setModerationStats(stats);
      })
      .catch(err => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  // Moderation action handlers
  const handleReportAction = async (reportId, action, additionalParams = {}) => {
    const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    setProcessingReport(reportId);
    
    try {
      let endpoint = '';
      let method = 'PATCH';
      let body = {};
      
      switch(action) {
        case 'review':
          endpoint = `/reports/${reportId}/review`;
          break;
        case 'dismiss':
          endpoint = `/reports/${reportId}/dismiss`;
          body = { reason: additionalParams.reason || 'Not a violation' };
          break;
        case 'warn':
          endpoint = `/reports/${reportId}/resolve`;
          body = { 
            resolution_action: 'user_warned',
            resolution_notes: additionalParams.notes || 'First offense warning'
          };
          break;
        case 'suspend':
          endpoint = `/reports/${reportId}/resolve`;
          body = { 
            resolution_action: 'user_suspended',
            resolution_notes: additionalParams.notes || 'Multiple violations - 7 day suspension'
          };
          break;
        case 'ban':
          endpoint = `/reports/${reportId}/resolve`;
          body = { 
            resolution_action: 'user_banned',
            resolution_notes: additionalParams.notes || 'Severe violation - permanent ban'
          };
          break;
        default:
          throw new Error('Invalid action');
      }
      
      const response = await fetch(`${API}${endpoint}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error(`Action failed: ${response.status}`);
      
      const result = await response.json();
      
      // Update the report in the list
      setReports(prevReports => 
        prevReports.map(r => 
          r.id === reportId ? { ...r, ...result.report } : r
        )
      );
      
      // Refresh stats
      const statsResponse = await fetch(`${API}/reports/stats`, { credentials: 'include' });
      if (statsResponse.ok) {
        const newStats = await statsResponse.json();
        setModerationStats(newStats);
      }
      
    } catch (err) {
      console.error('Moderation action failed:', err);
      alert(`Failed to ${action} report: ${err.message}`);
    } finally {
      setProcessingReport(null);
    }
  };

  const dataMap = {
    waitlists,
    feedbacks,
    contacts,
    bugs,
    flagged_restaurants: flaggedRestaurants,
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
                <AnalyticsTitle style={{ marginTop: '3rem' }}>Admin Users</AnalyticsTitle>
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

      {activeTab === 'moderation' && (
        <ModerationSection>
          <ModerationContainer>
            {moderationStats && (
              <ModerationStats>
              <StatusCard color="#3b82f6">
                <div className="number">{moderationStats.total_reports || 0}</div>
                <div className="label">Total Reports</div>
              </StatusCard>
              <StatusCard color="#f59e0b">
                <div className="number">{moderationStats.pending_reports || 0}</div>
                <div className="label">Pending</div>
              </StatusCard>
              <StatusCard color="#ef4444">
                <div className="number">{moderationStats.overdue_reports || 0}</div>
                <div className="label">Overdue (24h+)</div>
              </StatusCard>
              <StatusCard color="#22c55e">
                <div className="number">{moderationStats.resolved_today || 0}</div>
                <div className="label">Resolved Today</div>
              </StatusCard>
            </ModerationStats>
          )}
          
          {loading && <LoadingSpinner>Loading reports...</LoadingSpinner>}
          {error && <MutedText>Error loading reports: {error}</MutedText>}
          
          {!loading && !error && reports.length === 0 && (
            <MutedText style={{ textAlign: 'center', padding: '2rem' }}>
              No reports to review. All clear! 
            </MutedText>
          )}
          
          {!loading && !error && reports.map(report => (
            <ReportCard 
              key={report.id} 
              $status={report.status}
              $overdue={report.overdue}
            >
              <ReportHeader>
                <ReportInfo>
                  <h3 style={{ color: colors.textPrimary, margin: '0 0 0.5rem' }}>
                    Report #{report.id}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge $status={report.status}>
                      {report.status === 'pending' && <Clock size={14} />}
                      {report.status === 'reviewing' && <AlertCircle size={14} />}
                      {report.status === 'resolved' && <CheckCircle size={14} />}
                      {report.status === 'dismissed' && <XCircle size={14} />}
                      {report.status}
                    </StatusBadge>
                    {report.overdue && (
                      <OverdueBadge>
                        <AlertTriangle size={14} />
                        Overdue
                      </OverdueBadge>
                    )}
                  </div>
                </ReportInfo>
                
                {report.status === 'pending' && (
                  <ReportActions>
                    <ReviewButton 
                      onClick={() => handleReportAction(report.id, 'review')}
                      disabled={processingReport === report.id}
                    >
                      <AlertCircle size={16} />
                      Review
                    </ReviewButton>
                  </ReportActions>
                )}
                
                {(report.status === 'reviewing' || report.status === 'pending') && (
                  <ReportActions>
                    <DismissButton
                      onClick={() => {
                        if (window.confirm('Dismiss this report as invalid?')) {
                          handleReportAction(report.id, 'dismiss');
                        }
                      }}
                      disabled={processingReport === report.id}
                    >
                      <XCircle size={16} />
                      Dismiss
                    </DismissButton>
                    <WarnButton
                      onClick={() => {
                        if (window.confirm('Issue a warning to the user?')) {
                          handleReportAction(report.id, 'warn');
                        }
                      }}
                      disabled={processingReport === report.id}
                    >
                      <AlertTriangle size={16} />
                      Warn
                    </WarnButton>
                    <SuspendButton
                      onClick={() => {
                        if (window.confirm('Suspend this user for 7 days?')) {
                          handleReportAction(report.id, 'suspend');
                        }
                      }}
                      disabled={processingReport === report.id}
                    >
                      <Clock size={16} />
                      Suspend
                    </SuspendButton>
                    <BanButton
                      onClick={() => {
                        if (window.confirm('PERMANENTLY BAN this user? This action cannot be easily undone.')) {
                          handleReportAction(report.id, 'ban');
                        }
                      }}
                      disabled={processingReport === report.id}
                    >
                      <Ban size={16} />
                      Ban
                    </BanButton>
                  </ReportActions>
                )}
              </ReportHeader>
              
              <ReportDetail>
                <h4>Report Details</h4>
                <p><strong>Type:</strong> {report.reportable_type}</p>
                <p><strong>Reason:</strong> {report.reason}</p>
                {report.description && <p><strong>Description:</strong> {report.description}</p>}
                <p><strong>Reported Content:</strong> {report.reported_content || 'N/A'}</p>
                
                {report.reporter && (
                  <>
                    <h4 style={{ marginTop: '1rem' }}>Reporter</h4>
                    <p>{report.reporter.name} (ID: {report.reporter.id})</p>
                  </>
                )}
                
                {report.reported_user && (
                  <>
                    <h4 style={{ marginTop: '1rem' }}>Reported User</h4>
                    <p>
                      {report.reported_user.name} ({report.reported_user.email})
                      {report.reported_user.warnings_count > 0 && (
                        <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>
                          ⚠️ {report.reported_user.warnings_count} previous warnings
                        </span>
                      )}
                    </p>
                  </>
                )}
                
                {report.resolution_action && (
                  <>
                    <h4 style={{ marginTop: '1rem' }}>Resolution</h4>
                    <p><strong>Action:</strong> {report.resolution_action}</p>
                    {report.resolution_notes && <p><strong>Notes:</strong> {report.resolution_notes}</p>}
                    {report.reviewed_by && <p><strong>Reviewed by:</strong> {report.reviewed_by.name}</p>}
                  </>
                )}
                
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: colors.textMuted }}>
                  Created: {new Date(report.created_at).toLocaleString()}
                  {report.reviewed_at && ` | Reviewed: ${new Date(report.reviewed_at).toLocaleString()}`}
                </p>
              </ReportDetail>
            </ReportCard>
          ))}
          </ModerationContainer>
        </ModerationSection>
      )}

      {activeTab !== 'analytics' && activeTab !== 'moderation' && (
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