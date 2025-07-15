import React, { useState, useContext } from 'react';
import { User, Users, Calendar, Clock, Plus, Mail, Coffee, MapPin, Star } from 'lucide-react';
import { UserContext } from '../context/user';
import { useNavigate } from 'react-router-dom';
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
  FunMessage,
  AddParticipantButton,

  // Completed components
  CompletedContainer,
  CompletedLabel,
  CompletedMessage,

  // Other
  NoActivitiesMessage,

  // Keyframes (imported for use in components)
  progressFill,
  progressShine,
  progressPulse
} from '../styles/UserActivities';

const ACTIVITY_CONFIG = {
  'Restaurant': {
    displayText: 'Lets Eat!',
    countdownText: 'Hope you and your crew savored every bite together! 🥂',
    countdownLabel: 'Meal Starts In',
    emoji: '🍜'
  },
  'Meeting': {
    displayText: 'Lets Meet!',
    countdownText: 'Convos unlocked and plans locked in—high-five to your crew! 🙌',
    countdownLabel: 'Meeting Starts In',
    emoji: '⏰'
  },
  'Game Night': {
    displayText: 'Game Time!',
    countdownText: 'Dice rolled, friendships scored—your group leveled up the fun! 🏆',
    countdownLabel: 'Game Night Starts In',
    emoji: '🎮'
  },
  'Cocktails': {
    displayText: 'Lets Go Out!',
    countdownText: 'Cheers to wild laughs and brighter memories—what a crew! 🥂',
    countdownLabel: 'Your Outing Starts In',
    emoji: '🍸'
  }
};

function getActivityDisplayInfo(activityType) {
  return ACTIVITY_CONFIG[activityType] || {
    displayText: 'Lets Meet!',
    countdownText: 'Amazing memories were made—what a fantastic time! 🎉',
    countdownLabel: 'Activity Starts In',
    emoji: '🎉'
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

function CountdownText({ targetTs, activityType }) {
  const displayInfo = getActivityDisplayInfo(activityType);
  const now = Date.now();
  const diff = targetTs - now;

  if (diff <= 0) {
    return (
      <CountdownContainer>
        <CountdownLabel>Activity Started!</CountdownLabel>
      </CountdownContainer>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = n => String(n).padStart(2, '0');

  return (
    <CountdownContainer>
      <CountdownLabel>
        {displayInfo.countdownLabel}
      </CountdownLabel>
      <CountdownGrid>
        {days > 0 && (
          <CountdownBlock>
            <CountdownNumber>{days}</CountdownNumber>
            <CountdownUnit>day{days !== 1 ? 's' : ''}</CountdownUnit>
          </CountdownBlock>
        )}
        <CountdownBlock>
          <CountdownNumber>{pad(hours)}</CountdownNumber>
          <CountdownUnit>hrs</CountdownUnit>
        </CountdownBlock>
        <CountdownBlock>
          <CountdownNumber>{pad(minutes)}</CountdownNumber>
          <CountdownUnit>min</CountdownUnit>
        </CountdownBlock>
        <CountdownBlock>
          <CountdownNumber>{pad(seconds)}</CountdownNumber>
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
  const [filter, setFilter] = useState('In Progress');
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
  const inProgress = uniqueActivities.filter(a => !a.finalized && !a.completed);
  const finalized = uniqueActivities.filter(a => a.finalized && !a.completed);
  const past = uniqueActivities.filter(a => a.completed);
  const invites = pendingInvites;

  const filteredActivities = (() => {
    const dataMap = {
      'In Progress': inProgress,
      'Finalized': finalized,
      'Past': past,
      'Invites': invites,
    };
    return dataMap[filter] || [];
  })();

  const isInvitesEmpty = filter === 'Invites' && filteredActivities.length === 0;

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
        <NewBoardButton onClick={handleNewActivity}>+ New</NewBoardButton>
        <FilterButton
          $active={filter === 'In Progress'}
          onClick={() => setFilter('In Progress')}
        >
          In Progress {inProgress.length > 0 && <FilterBadge>{inProgress.length}</FilterBadge>}
        </FilterButton>
        <FilterButton
          $active={filter === 'Finalized'}
          onClick={() => setFilter('Finalized')}
        >
          Finalized {finalized.length > 0 && <FilterBadge>{finalized.length}</FilterBadge>}
        </FilterButton>
        <FilterButton
          $active={filter === 'Past'}
          onClick={() => setFilter('Past')}
        >
          Past {past.length > 0 && <FilterBadge>{past.length}</FilterBadge>}
        </FilterButton>
        <FilterButton
          $active={filter === 'Invites'}
          onClick={() => setFilter('Invites')}
        >
          Invites {invites.length > 0 && <FilterBadge>{invites.length}</FilterBadge>}
        </FilterButton>
      </FilterRow>

      {/* Activities Section */}
      <CardsContainer>
        {!hasAnyActivities ? (
          <NoActivitiesMessage>
            <h3>Ready to start planning? ✨</h3>
            <p>Create your first activity and start bringing people together!</p>
            <NewBoardButton onClick={handleNewActivity}>Create Your First Activity</NewBoardButton>
          </NoActivitiesMessage>
        ) : (
          <ActivitiesGrid>
            {filteredActivities.map((item) => {
              const firstName = item.user?.name?.split(' ')[0] || item.user?.email || '';
              const isInvite = invites.some(invite => invite.id === item.id);
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
                            <InviteLabel>{firstName} invited you!</InviteLabel>
                          </InviteHeader>
                          <FunMessage>
                            Ready to join the {displayInfo.emoji} fun?
                          </FunMessage>
                        </InviteContent>
                        <AddParticipantButton onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/activity/${item.id}`);
                        }}>
                          <span>+ Accept Invite</span>
                        </AddParticipantButton>
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