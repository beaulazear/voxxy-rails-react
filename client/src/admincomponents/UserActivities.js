import React, { useState, useContext, useEffect } from 'react';
import { User, Users, Calendar, Clock, Plus, Mail, Coffee, MapPin, Star, Grid3x3, List, Zap, Activity, Gamepad2, Wine, Utensils, ChevronRight, CheckCircle } from 'lucide-react';
import { UserContext } from '../context/user';
import { useNavigate } from 'react-router-dom';
// Removed unused YourCommunity import
import {
  // Main containers
  Container,
  HeroContainer,
  HeroContent,
  HeroTitle,
  HeroSubtitle,
  FilterRow,
  FilterButton,
  NewBoardButton,
  FilterBadge,
  CardsContainer,
  ActivitiesGrid,

  // Activity cards
  ActivityCard,
  ImageContainer,
  CardContent,
  CardFooter,
  CardTitle,
  MetaRow,
  MetaItem,
  BottomRow,
  ViewLink,
  PartCount,

  // Create cards
  CreateCard,
  CreateImageContainer,
  CreateTypeTag,
  CreateCardContent,
  CreateIconContainer,
  CreateTitle,
  CreateSubtitle,
  CreateSuggestions,
  SuggestionIcon,
  CreateArrow,
  CreateCardFooter,
  CreateFooterText,
  InvitesEmptyIcon,

  // Tags
  HostTag,
  TypeTag,

  // Progress components
  ProgressOverlay,
  ProgressStage,
  ProgressBarContainer,
  ProgressBar,

  // Countdown components
  CountdownContainer,
  CountdownLabel,
  CountdownGrid,
  CountdownBlock,
  CountdownNumber,
  CountdownUnit,

  // Invite components
  InviteContainer,
  InviteContent,
  InviteHeader,
  InviteLabel,

  // Completed components
  CompletedContainer,
  CompletedLabel,
  CompletedMessage,

  // Other
  NoActivitiesMessage,
  
  // Empty state components
  EmptyStateContainer,
  StartAdventureButton,
  AdventureIconContainer,
  AdventureButtonText,
  AdventureButtonSubtext,
  
  // List view components
  ListViewContainer,
  ListItem,
  ListItemIcon,
  ListItemContent,
  ListItemTitle,
  ListItemMeta,
  ListItemBadge,
  ListItemActions
} from '../styles/UserActivities';

const ACTIVITY_CONFIG = {
  'Restaurant': {
    displayText: 'Food',
    countdownText: 'Hope you and your crew savored every bite together! 🥂',
    countdownLabel: 'Meal Starts In',
    emoji: '🍜',
    icon: Utensils,
    iconColor: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #FF6B6B, #FF5252)'
  },
  'Meeting': {
    displayText: 'Lets Meet!',
    countdownText: 'Convos unlocked and plans locked in—high-five to your crew! 🙌',
    countdownLabel: 'Meeting Starts In',
    emoji: '⏰',
    icon: Users,
    iconColor: '#B8A5C4',
    gradient: 'linear-gradient(135deg, #B8A5C4, #9B86BD)'
  },
  'Game Night': {
    displayText: 'Game Night',
    countdownText: 'Dice rolled, friendships scored—your group leveled up the fun! 🏆',
    countdownLabel: 'Game Night Starts In',
    emoji: '🎮',
    icon: Gamepad2,
    iconColor: '#A8E6CF',
    gradient: 'linear-gradient(135deg, #A8E6CF, #7FD1AE)'
  },
  'Cocktails': {
    displayText: 'Drinks',
    countdownText: 'Cheers to wild laughs and brighter memories—what a crew! 🥂',
    countdownLabel: 'Your Outing Starts In',
    emoji: '🍸',
    icon: Wine,
    iconColor: '#4ECDC4',
    gradient: 'linear-gradient(135deg, #4ECDC4, #44A3BC)'
  }
};

function getActivityDisplayInfo(activityType) {
  return ACTIVITY_CONFIG[activityType] || {
    displayText: 'Lets Meet!',
    countdownText: 'Amazing memories were made—what a fantastic time! 🎉',
    countdownLabel: 'Activity Starts In',
    emoji: '🎉',
    icon: Activity,
    iconColor: '#B8A5C4',
    gradient: 'linear-gradient(135deg, #A855F7, #9333EA)'
  };
}

function formatDate(dateString) {
  if (!dateString) return 'TBD';
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const monthName = d.toLocaleString('en-US', { month: 'long' });
  const dayNum = d.getDate();
  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `${monthName} ${dayNum}${getOrdinalSuffix(dayNum)}`;
}

function formatTime(timeString) {
  if (!timeString) return 'TBD';
  const timePortion = timeString.split('T')[1];
  const [rawHour, rawMin] = timePortion.split(':');
  let hour = parseInt(rawHour, 10);
  const suffix = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return `${hour}:${rawMin} ${suffix}`;
}

function getEventDateTime(activity) {
  if (!activity.date_day || !activity.date_time) return null;
  const [Y, M, D] = activity.date_day.split('-').map(Number);
  const rawTime = activity.date_time.slice(11, 19);
  const [h, m, s] = rawTime.split(':').map(Number);
  return new Date(Y, M - 1, D, h, m, s).getTime();
}

function ProgressDisplay({ activity }) {
  const pins = activity.pinned_activities || [];
  const ideas = pins.length;
  const hasSelectedPin = pins.some(p => p.selected);
  const hasDateTime = activity.date_day && activity.date_time;

  let stageDisplay = 'Collecting Phase';
  let progress = 33;

  if (hasSelectedPin && hasDateTime) {
    stageDisplay = 'Ready to Go';
    progress = 100;
  } else if (ideas > 0) {
    stageDisplay = 'Voting Phase';
    progress = 67;
  }

  return (
    <ProgressOverlay>
      <ProgressStage>{stageDisplay}</ProgressStage>
      <ProgressBarContainer>
        <ProgressBar $progress={progress} />
      </ProgressBarContainer>
    </ProgressOverlay>
  );
}

// Custom hook for countdown with real-time updates
function useCountdown(targetTs) {
  const [timeLeft, setTimeLeft] = useState(Math.max(targetTs - Date.now(), 0));
  
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const intervalId = setInterval(() => {
      const remaining = Math.max(targetTs - Date.now(), 0);
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(intervalId);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [targetTs, timeLeft]);

  const days = Math.floor(timeLeft / (24 * 3600000));
  const hours = Math.floor((timeLeft % (24 * 3600000)) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  return { days, hours, minutes, seconds, isComplete: timeLeft === 0 };
}

function CountdownText({ targetTs, activityType }) {
  const displayInfo = getActivityDisplayInfo(activityType);
  const countdown = useCountdown(targetTs);
  const pad = n => String(n).padStart(2, '0');

  if (countdown.isComplete) {
    return (
      <CountdownContainer>
        <CountdownLabel style={{ color: '#A8E6CF' }}>Started! 🎉</CountdownLabel>
      </CountdownContainer>
    );
  }

  return (
    <CountdownContainer>
      <CountdownLabel>
        {displayInfo.countdownLabel}
      </CountdownLabel>
      <CountdownGrid>
        {countdown.days > 0 && (
          <CountdownBlock>
            <CountdownNumber>{countdown.days}</CountdownNumber>
            <CountdownUnit>day{countdown.days !== 1 ? 's' : ''}</CountdownUnit>
          </CountdownBlock>
        )}
        <CountdownBlock>
          <CountdownNumber>{pad(countdown.hours)}</CountdownNumber>
          <CountdownUnit>hrs</CountdownUnit>
        </CountdownBlock>
        <CountdownBlock>
          <CountdownNumber>{pad(countdown.minutes)}</CountdownNumber>
          <CountdownUnit>min</CountdownUnit>
        </CountdownBlock>
        <CountdownBlock>
          <CountdownNumber>{pad(countdown.seconds)}</CountdownNumber>
          <CountdownUnit>sec</CountdownUnit>
        </CountdownBlock>
      </CountdownGrid>
    </CountdownContainer>
  );
}

function CreateCardComponent({ isInvitesEmpty = false, onClick }) {
  const title = isInvitesEmpty ? 'No Current Invites' : 'Create New Activity';
  const subtitle = isInvitesEmpty ? 'Be the first to invite your friends!' : 'Start planning something amazing!';
  const actionText = isInvitesEmpty ? 'Start planning now →' : 'Get started →';

  return (
    <CreateCard $isInvitesEmpty={isInvitesEmpty} onClick={onClick}>
      {/* Background Image */}
      <CreateImageContainer $isInvitesEmpty={isInvitesEmpty} />

      <CreateTypeTag $isInvitesEmpty={isInvitesEmpty}>
        <span>{isInvitesEmpty ? '💌 Invite' : '✨ Create'}</span>
      </CreateTypeTag>

      <CreateCardContent>
        <CreateIconContainer $isInvitesEmpty={isInvitesEmpty}>
          {isInvitesEmpty ? (
            <Mail stroke="#d394f5" width={24} height={24} strokeWidth={2.5} />
          ) : (
            <Plus stroke="#4ECDC4" width={24} height={24} strokeWidth={2.5} />
          )}
        </CreateIconContainer>

        <CreateTitle>{title}</CreateTitle>
        <CreateSubtitle>{subtitle}</CreateSubtitle>

        {!isInvitesEmpty && (
          <CreateSuggestions>
            <SuggestionIcon>
              <Coffee stroke="#FF6B6B" width={14} height={14} strokeWidth={2} />
            </SuggestionIcon>
            <SuggestionIcon>
              <Star stroke="#4ECDC4" width={14} height={14} strokeWidth={2} />
            </SuggestionIcon>
            <SuggestionIcon>
              <MapPin stroke="#FFE66D" width={14} height={14} strokeWidth={2} />
            </SuggestionIcon>
            <SuggestionIcon>
              <User stroke="#A8E6CF" width={14} height={14} strokeWidth={2} />
            </SuggestionIcon>
          </CreateSuggestions>
        )}

        {isInvitesEmpty && (
          <InvitesEmptyIcon>💌</InvitesEmptyIcon>
        )}

        <CreateArrow $isInvitesEmpty={isInvitesEmpty}>
          <span>{actionText}</span>
        </CreateArrow>
      </CreateCardContent>

      <CreateCardFooter>
        <CreateFooterText>
          {isInvitesEmpty ? 'Tap to create your first activity' : 'Choose your adventure'}
        </CreateFooterText>
      </CreateCardFooter>
    </CreateCard>
  );
}

function UserActivities() {
  const { user } = useContext(UserContext);
  const [filter, setFilter] = useState('Active');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFavorites, setShowFavorites] = useState(false);
  const navigate = useNavigate();

  // Get activities from user context
  const allActivities = [
    ...(user?.activities || []),
    ...(user?.participant_activities
      ?.filter(p => p.accepted)
      .map(p => p.activity) || [])
  ];

  // Get pending invites
  const pendingInvites = user?.participant_activities
    ?.filter(p => !p.accepted)
    .map(p => p.activity) || [];

  // Remove duplicates using Map
  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];

  // Filter activities based on current filter
  const activeActivities = uniqueActivities.filter(a => !a.completed);
  const pastActivities = uniqueActivities.filter(a => a.completed);
  // const favoriteActivities = uniqueActivities.filter(a => a.is_favorite); // TODO: Add favorites field to backend
  
  // Combine active filter with favorites if needed
  let filteredActivities = [];
  
  if (filter === 'Active') {
    filteredActivities = [...activeActivities, ...pendingInvites];
  } else if (filter === 'Past') {
    filteredActivities = pastActivities;
  }
  
  // Apply favorites filter on top if enabled
  if (showFavorites && filter !== 'Past') {
    filteredActivities = filteredActivities.filter(a => a.is_favorite);
  }

  const isInvitesEmpty = pendingInvites.length === 0 && filter === 'Active' && filteredActivities.length === 0;

  // Navigation functions using React Router's navigate
  const handleNewActivity = () => {
    navigate('/create-trip');
  };

  const handleActivityClick = (activityId) => {
    navigate(`/activity/${activityId}`);
  };

  const handleCreateCardClick = () => {
    navigate('/create-trip');
  };

  const handleViewLinkClick = (e, activityId) => {
    e.stopPropagation(); // Prevent card click from firing
    navigate(`/activity/${activityId}`);
  };

  // Show welcome message if user has no activities at all
  if (!user) {
    return (
      <Container>
        <NoActivitiesMessage>
          <h3>Loading...</h3>
        </NoActivitiesMessage>
      </Container>
    );
  }

  const hasAnyActivities = uniqueActivities.length > 0 || pendingInvites.length > 0;

  return (
    <Container>
      <HeroContainer>
        <HeroContent>
          <HeroTitle>Welcome back, {user.name || user.email}! 👋</HeroTitle>
          <HeroSubtitle>What are you planning today?</HeroSubtitle>
        </HeroContent>
      </HeroContainer>

      <FilterRow>
        <NewBoardButton onClick={handleNewActivity}>
          <Plus width={16} height={16} style={{ marginRight: 4 }} />
          New
        </NewBoardButton>
        
        {/* View Mode Toggle */}
        <FilterButton
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={{ padding: '8px 12px' }}
          title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
        >
          {viewMode === 'grid' ? <List width={18} height={18} /> : <Grid3x3 width={18} height={18} />}
        </FilterButton>
        
        {/* Active/Past Toggle */}
        <FilterButton
          $active={filter === 'Active'}
          onClick={() => {
            setFilter('Active');
            setShowFavorites(false); // Reset favorites when changing main filter
          }}
        >
          <Zap width={14} height={14} style={{ marginRight: 4 }} />
          Active {activeActivities.length > 0 && <FilterBadge>{activeActivities.length}</FilterBadge>}
        </FilterButton>
        
        <FilterButton
          $active={filter === 'Past'}
          onClick={() => {
            setFilter('Past');
            setShowFavorites(false); // Reset favorites when changing main filter
          }}
        >
          Past {pastActivities.length > 0 && <FilterBadge>{pastActivities.length}</FilterBadge>}
        </FilterButton>
        
        {/* Favorites Toggle */}
        <FilterButton
          $active={showFavorites}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Star width={14} height={14} style={{ marginRight: 4 }} fill={showFavorites ? '#FFE66D' : 'none'} />
          Favorites
        </FilterButton>
      </FilterRow>

      {/* Activities Section */}
      <CardsContainer>
        {!hasAnyActivities ? (
          <EmptyStateContainer>
            <StartAdventureButton onClick={handleNewActivity}>
              <AdventureIconContainer>
                <Zap width={32} height={32} color="#fff" />
              </AdventureIconContainer>
              <AdventureButtonText>Start New Adventure</AdventureButtonText>
              <AdventureButtonSubtext>Plan something amazing with your friends</AdventureButtonSubtext>
            </StartAdventureButton>
          </EmptyStateContainer>
        ) : filteredActivities.length === 0 && showFavorites ? (
          <NoActivitiesMessage>
            <Star width={48} height={48} color="#FFE66D" style={{ marginBottom: '1rem' }} />
            <h3>No favorites yet</h3>
            <p>Star your favorite activities to see them here!</p>
          </NoActivitiesMessage>
        ) : filteredActivities.length === 0 ? (
          <NoActivitiesMessage>
            <h3>No activities here</h3>
            <p>Start planning something new!</p>
          </NoActivitiesMessage>
        ) : viewMode === 'list' ? (
          // List View
          <ListViewContainer>
            {filteredActivities.map((item) => {
              const firstName = item.user?.name?.split(' ')[0] || item.user?.email || '';
              const isInvite = pendingInvites.some(invite => invite.id === item.id);
              const isInProgress = !item.finalized && !item.completed && !isInvite;
              const isFinalizedWithDateTime = item.finalized && item.date_day && item.date_time;
              const isCompleted = item.completed;
              const displayInfo = getActivityDisplayInfo(item.activity_type);
              
              // Determine badge type
              let badgeType = 'default';
              let badgeText = displayInfo.displayText;
              
              if (isInvite) {
                badgeType = 'invite';
                badgeText = 'New Invite';
              } else if (isInProgress) {
                badgeType = 'active';
                badgeText = 'In Progress';
              } else if (isFinalizedWithDateTime) {
                badgeType = 'finalized';
                badgeText = 'Finalized';
              } else if (isCompleted) {
                badgeType = 'completed';
                badgeText = 'Completed';
              }
              
              // Determine what title to show
              const displayTitle = (isFinalizedWithDateTime || isCompleted) ? 
                item.activity_name : 
                displayInfo.displayText;

              // Get gradient for icon based on activity type
              const gradient = displayInfo.gradient || 'linear-gradient(135deg, #A855F7, #9333EA)';

              return (
                <ListItem
                  key={item.id}
                  $isInvite={isInvite}
                  $isActive={isInProgress}
                  $isFinalized={isFinalizedWithDateTime}
                  $isCompleted={isCompleted}
                  onClick={() => handleActivityClick(item.id)}
                >
                  <ListItemIcon $gradient={gradient}>
                    {item.emoji || displayInfo.emoji}
                  </ListItemIcon>
                  
                  <ListItemContent>
                    <ListItemTitle>{displayTitle}</ListItemTitle>
                    <ListItemMeta>
                      <span>
                        <Users size={12} />
                        {firstName}
                      </span>
                      <span>
                        <Calendar size={12} />
                        {formatDate(item.date_day)}
                      </span>
                      <span>
                        <Clock size={12} />
                        {formatTime(item.date_time)}
                      </span>
                    </ListItemMeta>
                  </ListItemContent>
                  
                  <ListItemActions>
                    <ListItemBadge $type={badgeType}>
                      {badgeType === 'invite' && <Mail size={12} />}
                      {badgeType === 'active' && <Zap size={12} />}
                      {badgeType === 'finalized' && <CheckCircle size={12} />}
                      {badgeText}
                    </ListItemBadge>
                    <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
                  </ListItemActions>
                </ListItem>
              );
            })}
          </ListViewContainer>
        ) : (
          // Grid View (Cards)
          <ActivitiesGrid $viewMode={viewMode}>
            {filteredActivities.map((item) => {
              const firstName = item.user?.name?.split(' ')[0] || item.user?.email || '';
              const isInvite = pendingInvites.some(invite => invite.id === item.id);
              const isInProgress = !item.finalized && !item.completed && !isInvite;
              const isFinalizedWithDateTime = item.finalized && item.date_day && item.date_time;
              const isCompleted = item.completed;
              const displayInfo = getActivityDisplayInfo(item.activity_type);
              const hasOverlay = isInvite || isInProgress || isFinalizedWithDateTime || isCompleted;

              let countdownTs = null;
              if (isFinalizedWithDateTime) {
                countdownTs = getEventDateTime(item);
              }

              return (
                <ActivityCard
                  key={item.id}
                  $isInvite={isInvite}
                  onClick={() => handleActivityClick(item.id)}
                >
                  {/* Background Image */}
                  <ImageContainer $isInvite={isInvite} $hasOverlay={hasOverlay} />

                  <HostTag>
                    <Users stroke="#fff" width={10} height={10} />
                    <span>{firstName}</span>
                  </HostTag>
                  <TypeTag $isInvite={isInvite}>
                    <span>{item.emoji || displayInfo.emoji} {displayInfo.displayText}</span>
                  </TypeTag>

                  <CardContent>
                    {isInvite ? (
                      <InviteContainer>
                        <InviteContent>
                          <InviteHeader>
                            <Mail stroke="#d394f5" width={18} height={18} />
                            <InviteLabel>{firstName}: {item.welcome_message}</InviteLabel>
                          </InviteHeader>
                        </InviteContent>
                      </InviteContainer>
                    ) : countdownTs ? (
                      <CountdownText targetTs={countdownTs} activityType={item.activity_type} />
                    ) : isInProgress ? (
                      <ProgressDisplay activity={item} />
                    ) : isCompleted ? (
                      <CompletedContainer>
                        <CompletedLabel>ACTIVITY COMPLETED</CompletedLabel>
                        <CompletedMessage>
                          {displayInfo.countdownText}
                        </CompletedMessage>
                      </CompletedContainer>
                    ) : null}
                  </CardContent>

                  <CardFooter>
                    <CardTitle>{item.activity_name}</CardTitle>
                    <MetaRow>
                      <MetaItem>
                        <Calendar stroke="rgba(255, 255, 255, 0.8)" width={14} height={14} />
                        <span>{formatDate(item.date_day)}</span>
                      </MetaItem>
                      <MetaItem>
                        <Clock stroke="rgba(255, 255, 255, 0.8)" width={14} height={14} />
                        <span>{formatTime(item.date_time)}</span>
                      </MetaItem>
                    </MetaRow>
                    <BottomRow>
                      <ViewLink onClick={(e) => handleViewLinkClick(e, item.id)}>
                        {isInvite ? 'View invite' : isInProgress ? 'Continue planning' : 'View board'} →
                      </ViewLink>
                      <PartCount>
                        <span>{(item.participants?.length || 0) + 1} people</span>
                      </PartCount>
                    </BottomRow>
                  </CardFooter>
                </ActivityCard>
              );
            })}

            {/* Always show create card at the end */}
            <CreateCardComponent isInvitesEmpty={isInvitesEmpty} onClick={handleCreateCardClick} />
          </ActivitiesGrid>
        )}
      </CardsContainer>
    </Container>
  );
}

function UserActivitiesDemo() {
  const { user } = useContext(UserContext);

  return (
    <UserContext.Provider value={{ user: user }}>
      <UserActivities />
    </UserContext.Provider>
  );
}

export default UserActivitiesDemo;