import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Gamepad2, Users, Calendar, Clock, MessageSquare, Send, X, ChevronLeft, ChevronRight, Monitor, Dice6, Zap, Target, Heart, Trophy, Timer, Smile } from 'lucide-react';

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
`;

const ProgressBarContainer = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  width: 100%;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const StepLabel = styled.div`
  padding: 1rem 2rem 0.5rem;
  font-size: 0.85rem;
  color: #cc31e8;
  text-align: center;
  font-weight: 600;
`;

const ModalHeader = styled.div`
  padding: 0 2rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -0.5rem;
  right: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const Title = styled.h2`
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Subtitle = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ChatContent = styled.div`
  padding: 1.5rem 2rem;
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cc31e8;
    border-radius: 2px;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const OptionCard = styled.button`
  background: ${({ $selected }) =>
        $selected
            ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
            : 'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected }) =>
        $selected
            ? 'none'
            : '2px solid rgba(255, 255, 255, 0.1)'};
  color: #fff;
  padding: 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  
  &:hover {
    background: ${({ $selected }) =>
        $selected
            ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
            : 'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-2px);
    box-shadow: ${({ $selected }) =>
        $selected
            ? '0 8px 20px rgba(204, 49, 232, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.2)'};
    border-color: ${({ $selected }) =>
        $selected
            ? 'transparent'
            : '#cc31e8'};
  }
`;

const MultiSelectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MultiSelectCard = styled.button`
  background: ${({ $selected }) =>
        $selected
            ? 'rgba(204, 49, 232, 0.3)'
            : 'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected }) =>
        $selected
            ? '2px solid #cc31e8'
            : '2px solid rgba(255, 255, 255, 0.1)'};
  color: #fff;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  
  &:hover {
    background: ${({ $selected }) =>
        $selected
            ? 'rgba(204, 49, 232, 0.4)'
            : 'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-1px);
    border-color: #cc31e8;
  }
`;

const SliderContainer = styled.div`
  margin: 1rem 0;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
`;

const Slider = styled.input.attrs({ type: 'range' })`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(204, 49, 232, 0.3);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(204, 49, 232, 0.3);
  }
`;

const AvailabilitySection = styled.div`
  margin-top: 1rem;
`;

const DateTimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: all 0.2s ease;
  
  &:focus { 
    border-color: #cc31e8; 
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::-webkit-calendar-picker-indicator { 
    filter: invert(1) brightness(2); 
    cursor: pointer; 
  }
  
  &::placeholder { 
    color: #aaa; 
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AddTimeButton = styled.button`
  background: rgba(204, 49, 232, 0.1);
  border: 2px solid rgba(204, 49, 232, 0.3);
  color: #cc31e8;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(204, 49, 232, 0.2);
    transform: translateY(-1px);
  }
`;

const TimeSlotsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const TimeSlot = styled.div`
  background: rgba(204, 49, 232, 0.2);
  border: 1px solid rgba(204, 49, 232, 0.4);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RemoveTimeButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #ff6b6b;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
`;

const Button = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  
  background: ${({ $primary }) =>
        $primary
            ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
            : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $primary }) => ($primary ? 'white' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '2px solid rgba(204, 49, 232, 0.3)')};
  
  &:hover:not(:disabled) { 
    transform: translateY(-2px);
    box-shadow: ${({ $primary }) =>
        $primary
            ? '0 8px 20px rgba(204, 49, 232, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.2)'};
    background: ${({ $primary }) =>
        $primary
            ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
            : 'rgba(255, 255, 255, 0.08)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SectionDescription = styled.p`
  color: #ccc;
  font-size: 0.85rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
`;

export default function GameNightPreferenceChat({ activityId, onClose, onChatComplete }) {
    const { user } = useContext(UserContext);
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [gameType, setGameType] = useState('');
    const [consoles, setConsoles] = useState([]);
    const [traditionalGames, setTraditionalGames] = useState([]);
    const [gameGenres, setGameGenres] = useState([]);
    const [playStyle, setPlayStyle] = useState('');
    const [competitiveness, setCompetitiveness] = useState('');
    const [duration, setDuration] = useState(60);
    const [atmosphere, setAtmosphere] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Availability state
    const [availability, setAvailability] = useState({});
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const [activity, setActivity] = useState(null);

    const totalSteps = 9;

    React.useEffect(() => {
        fetch(`${API_URL}/activities/${activityId}`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => setActivity(data))
            .catch(err => console.error('Error fetching activity:', err));
    }, [activityId, API_URL]);

    const stepTitles = [
        "What type of games interest you?",
        "Gaming consoles & platforms",
        "Traditional games you have",
        "What game genres do you enjoy?",
        "How do you like to play?",
        "How competitive is your group?",
        "Session length & atmosphere",
        "Experience level",
        "Additional preferences"
    ];

    if (activity?.allow_participant_time_selection) {
        stepTitles.push("Your availability");
    }

    const handleMultiSelect = (value, currentArray, setter) => {
        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        setter(newArray);
    };

    const addTimeSlot = () => {
        if (!currentDate || !currentTime) return;

        const dateKey = currentDate;
        const timeValue = currentTime;

        setAvailability(prev => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), timeValue]
        }));

        setCurrentDate('');
        setCurrentTime('');
    };

    const removeTimeSlot = (date, timeToRemove) => {
        setAvailability(prev => {
            const newAvailability = { ...prev };
            newAvailability[date] = newAvailability[date].filter(time => time !== timeToRemove);

            if (newAvailability[date].length === 0) {
                delete newAvailability[date];
            }

            return newAvailability;
        });
    };

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} minutes`;
        if (minutes === 60) return '1 hour';
        if (minutes < 120) return `${minutes} minutes`;
        if (minutes === 120) return '2 hours';
        if (minutes === 180) return '3 hours';
        if (minutes === 240) return '4+ hours';
        return `${Math.floor(minutes / 60)} hours`;
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1: return gameType !== '';
            case 2: return true; // Optional
            case 3: return true; // Optional
            case 4: return gameGenres.length > 0;
            case 5: return playStyle !== '';
            case 6: return competitiveness !== '';
            case 7: return atmosphere !== '';
            case 8: return experienceLevel !== '';
            case 9: return true; // Optional notes
            case 10: return !activity?.allow_participant_time_selection || Object.keys(availability).length > 0;
            default: return true;
        }
    };

    const handleNext = () => {
        const finalStep = activity?.allow_participant_time_selection ? 10 : 9;
        if (currentStep < finalStep) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        const preferences = {
            gameType,
            consoles: consoles.length > 0 ? consoles : ['None specified'],
            traditionalGames: traditionalGames.length > 0 ? traditionalGames : ['Open to suggestions'],
            gameGenres,
            playStyle,
            competitiveness,
            duration: formatDuration(duration),
            atmosphere,
            experienceLevel,
            additionalNotes: additionalNotes || 'No additional preferences'
        };

        const notes = `Game Night Preferences:
🎮 Game Type: ${preferences.gameType}
🖥️ Consoles Available: ${preferences.consoles.join(', ')}
🎲 Traditional Games: ${preferences.traditionalGames.join(', ')}
🎯 Favorite Genres: ${preferences.gameGenres.join(', ')}
🤝 Play Style: ${preferences.playStyle}
🏆 Competitiveness: ${preferences.competitiveness}
⏱️ Preferred Duration: ${preferences.duration}
🌟 Atmosphere: ${preferences.atmosphere}
📊 Experience Level: ${preferences.experienceLevel}
💭 Additional Notes: ${preferences.additionalNotes}`;

        try {
            const response = await fetch(`${API_URL}/activities/${activityId}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    notes,
                    availability: activity?.allow_participant_time_selection ? availability : undefined
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit preferences');
            }

            if (process.env.NODE_ENV === 'production') {
                mixpanel.track('Game Night Preferences Submitted', {
                    user: user.id,
                    activityId: activityId,
                    gameType: preferences.gameType,
                    atmosphere: preferences.atmosphere
                });
            }

            onChatComplete();
        } catch (error) {
            console.error('Error submitting preferences:', error);
            alert('Failed to submit preferences. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const finalStep = activity?.allow_participant_time_selection ? 10 : 9;
    const percent = (currentStep / finalStep) * 100;

    return (
        <Overlay onClick={() => onClose()}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ProgressBarContainer>
                    <ProgressBar $percent={percent} />
                </ProgressBarContainer>

                <StepLabel>
                    Step {currentStep} of {finalStep}
                </StepLabel>

                <ModalHeader>
                    <Title>
                        <Gamepad2 size={24} />
                        {stepTitles[currentStep - 1]}
                    </Title>
                    <CloseButton onClick={() => onClose()}>
                        <X size={20} />
                    </CloseButton>
                </ModalHeader>

                <ChatContent>
                    {currentStep === 1 && (
                        <Section>
                            <SectionTitle><Monitor size={20} />Game Types</SectionTitle>
                            <SectionDescription>What type of games are you most interested in for this game night?</SectionDescription>
                            <OptionsGrid>
                                <OptionCard
                                    $selected={gameType === 'Video Games'}
                                    onClick={() => setGameType('Video Games')}
                                >
                                    🎮 Video Games
                                </OptionCard>
                                <OptionCard
                                    $selected={gameType === 'Board Games'}
                                    onClick={() => setGameType('Board Games')}
                                >
                                    🎲 Board Games
                                </OptionCard>
                                <OptionCard
                                    $selected={gameType === 'Card Games'}
                                    onClick={() => setGameType('Card Games')}
                                >
                                    🃏 Card Games
                                </OptionCard>
                                <OptionCard
                                    $selected={gameType === 'Open to All'}
                                    onClick={() => setGameType('Open to All')}
                                >
                                    ✨ Open to All
                                </OptionCard>
                            </OptionsGrid>
                        </Section>
                    )}

                    {currentStep === 2 && (
                        <Section>
                            <SectionTitle><Monitor size={20} />Gaming Consoles & Platforms</SectionTitle>
                            <SectionDescription>Which gaming consoles or platforms do you have available? (Select all that apply)</SectionDescription>
                            <MultiSelectGrid>
                                {['PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC Gaming', 'Steam Deck', 'Mobile Games', 'Retro Consoles', 'None'].map(console => (
                                    <MultiSelectCard
                                        key={console}
                                        $selected={consoles.includes(console)}
                                        onClick={() => handleMultiSelect(console, consoles, setConsoles)}
                                    >
                                        {console}
                                    </MultiSelectCard>
                                ))}
                            </MultiSelectGrid>
                        </Section>
                    )}

                    {currentStep === 3 && (
                        <Section>
                            <SectionTitle><Dice6 size={20} />Traditional Games Collection</SectionTitle>
                            <SectionDescription>What traditional games do you have available? (Select all that apply)</SectionDescription>
                            <MultiSelectGrid>
                                {['Classic Board Games', 'Strategy Board Games', 'Party Board Games', 'Card Games (Poker, etc.)', 'Jackbox Games', 'Trivia Games', 'Puzzle Games', 'Cooperative Games', 'Role-Playing Games', 'None - Need Suggestions'].map(game => (
                                    <MultiSelectCard
                                        key={game}
                                        $selected={traditionalGames.includes(game)}
                                        onClick={() => handleMultiSelect(game, traditionalGames, setTraditionalGames)}
                                    >
                                        {game}
                                    </MultiSelectCard>
                                ))}
                            </MultiSelectGrid>
                        </Section>
                    )}

                    {currentStep === 4 && (
                        <Section>
                            <SectionTitle><Target size={20} />Game Genres You Enjoy</SectionTitle>
                            <SectionDescription>What types of games do you most enjoy? (Select all that apply)</SectionDescription>
                            <MultiSelectGrid>
                                {['Strategy', 'Party Games', 'Cooperative', 'Competitive', 'Card Games', 'Trivia & Quizzes', 'Puzzle Games', 'Action Games', 'Role-Playing', 'Social Deduction', 'Word Games', 'Drawing Games'].map(genre => (
                                    <MultiSelectCard
                                        key={genre}
                                        $selected={gameGenres.includes(genre)}
                                        onClick={() => handleMultiSelect(genre, gameGenres, setGameGenres)}
                                    >
                                        {genre}
                                    </MultiSelectCard>
                                ))}
                            </MultiSelectGrid>
                        </Section>
                    )}

                    {currentStep === 5 && (
                        <Section>
                            <SectionTitle><Heart size={20} />Play Style Preference</SectionTitle>
                            <SectionDescription>How do you prefer to play with your group?</SectionDescription>
                            <OptionsGrid>
                                <OptionCard
                                    $selected={playStyle === 'Work Together'}
                                    onClick={() => setPlayStyle('Work Together')}
                                >
                                    🤝 Work Together<br />
                                    <small style={{ opacity: 0.8 }}>Cooperative games</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={playStyle === 'Friendly Competition'}
                                    onClick={() => setPlayStyle('Friendly Competition')}
                                >
                                    😊 Friendly Competition<br />
                                    <small style={{ opacity: 0.8 }}>Light competitive fun</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={playStyle === 'Mix of Both'}
                                    onClick={() => setPlayStyle('Mix of Both')}
                                >
                                    ⚖️ Mix of Both<br />
                                    <small style={{ opacity: 0.8 }}>Variety throughout night</small>
                                </OptionCard>
                            </OptionsGrid>
                        </Section>
                    )}

                    {currentStep === 6 && (
                        <Section>
                            <SectionTitle><Trophy size={20} />Competitiveness Level</SectionTitle>
                            <SectionDescription>How competitive is your group?</SectionDescription>
                            <OptionsGrid>
                                <OptionCard
                                    $selected={competitiveness === 'Casual and Relaxed'}
                                    onClick={() => setCompetitiveness('Casual and Relaxed')}
                                >
                                    😌 Casual & Relaxed<br />
                                    <small style={{ opacity: 0.8 }}>Just for fun</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={competitiveness === 'Moderately Competitive'}
                                    onClick={() => setCompetitiveness('Moderately Competitive')}
                                >
                                    🎯 Moderately Competitive<br />
                                    <small style={{ opacity: 0.8 }}>We like to win</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={competitiveness === 'Highly Competitive'}
                                    onClick={() => setCompetitiveness('Highly Competitive')}
                                >
                                    🔥 Highly Competitive<br />
                                    <small style={{ opacity: 0.8 }}>Victory at all costs</small>
                                </OptionCard>
                            </OptionsGrid>
                        </Section>
                    )}

                    {currentStep === 7 && (
                        <Section>
                            <SectionTitle><Timer size={20} />Session Length & Atmosphere</SectionTitle>
                            <SectionDescription>How long do you prefer to play and what atmosphere do you want?</SectionDescription>

                            <SliderContainer>
                                <SliderLabel>
                                    <span>Preferred Session Length:</span>
                                    <span style={{ color: '#cc31e8', fontWeight: '600' }}>{formatDuration(duration)}</span>
                                </SliderLabel>
                                <Slider
                                    min={30}
                                    max={240}
                                    step={30}
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                />
                            </SliderContainer>

                            <SectionDescription style={{ marginTop: '2rem' }}>What atmosphere do you prefer?</SectionDescription>
                            <OptionsGrid>
                                <OptionCard
                                    $selected={atmosphere === 'High Energy'}
                                    onClick={() => setAtmosphere('High Energy')}
                                >
                                    ⚡ High Energy<br />
                                    <small style={{ opacity: 0.8 }}>Fast-paced & exciting</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={atmosphere === 'Chill and Relaxed'}
                                    onClick={() => setAtmosphere('Chill and Relaxed')}
                                >
                                    😎 Chill & Relaxed<br />
                                    <small style={{ opacity: 0.8 }}>Laid-back vibes</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={atmosphere === 'Focused and Strategic'}
                                    onClick={() => setAtmosphere('Focused and Strategic')}
                                >
                                    🧠 Focused & Strategic<br />
                                    <small style={{ opacity: 0.8 }}>Deep thinking games</small>
                                </OptionCard>
                            </OptionsGrid>
                        </Section>
                    )}

                    {currentStep === 8 && (
                        <Section>
                            <SectionTitle><Smile size={20} />Experience Level</SectionTitle>
                            <SectionDescription>What's your group's overall gaming experience level?</SectionDescription>
                            <OptionsGrid>
                                <OptionCard
                                    $selected={experienceLevel === 'Beginner Friendly'}
                                    onClick={() => setExperienceLevel('Beginner Friendly')}
                                >
                                    🌱 Beginner Friendly<br />
                                    <small style={{ opacity: 0.8 }}>New to gaming</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={experienceLevel === 'Intermediate'}
                                    onClick={() => setExperienceLevel('Intermediate')}
                                >
                                    🎯 Intermediate<br />
                                    <small style={{ opacity: 0.8 }}>Some gaming experience</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={experienceLevel === 'Advanced'}
                                    onClick={() => setExperienceLevel('Advanced')}
                                >
                                    🏆 Advanced<br />
                                    <small style={{ opacity: 0.8 }}>Experienced gamers</small>
                                </OptionCard>
                                <OptionCard
                                    $selected={experienceLevel === 'Mixed Skill Levels'}
                                    onClick={() => setExperienceLevel('Mixed Skill Levels')}
                                >
                                    🌈 Mixed Skill Levels<br />
                                    <small style={{ opacity: 0.8 }}>Variety in our group</small>
                                </OptionCard>
                            </OptionsGrid>
                        </Section>
                    )}

                    {currentStep === 9 && (
                        <Section>
                            <SectionTitle><MessageSquare size={20} />Additional Preferences</SectionTitle>
                            <SectionDescription>Any other preferences, dietary restrictions for snacks, or specific games you'd love to try?</SectionDescription>
                            <textarea
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                placeholder="Tell us about any specific games you want to play, snack preferences, accessibility needs, or anything else that would make this the perfect game night..."
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '0.75rem',
                                    fontSize: '0.9rem',
                                    border: '2px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: '#fff',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </Section>
                    )}

                    {currentStep === 10 && activity?.allow_participant_time_selection && (
                        <Section>
                            <SectionTitle><Calendar size={20} />Your Availability</SectionTitle>
                            <SectionDescription>When are you available for this game night?</SectionDescription>

                            <DateTimeGrid>
                                <FormGroup>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem' }}>Date</label>
                                    <Input
                                        type="date"
                                        value={currentDate}
                                        onChange={(e) => setCurrentDate(e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem' }}>Time</label>
                                    <Input
                                        type="time"
                                        value={currentTime}
                                        onChange={(e) => setCurrentTime(e.target.value)}
                                    />
                                </FormGroup>
                            </DateTimeGrid>

                            <AddTimeButton
                                onClick={addTimeSlot}
                                disabled={!currentDate || !currentTime}
                            >
                                Add Time Slot
                            </AddTimeButton>

                            {Object.keys(availability).length > 0 && (
                                <AvailabilitySection>
                                    <h4 style={{ color: '#fff', margin: '1rem 0 0.5rem 0', fontSize: '0.9rem' }}>
                                        Your Availability:
                                    </h4>
                                    <TimeSlotsList>
                                        {Object.entries(availability).map(([date, times]) =>
                                            times.map((time, index) => (
                                                <TimeSlot key={`${date}-${time}-${index}`}>
                                                    {new Date(date).toLocaleDateString()} at {time}
                                                    <RemoveTimeButton
                                                        onClick={() => removeTimeSlot(date, time)}
                                                        title="Remove this time slot"
                                                    >
                                                        ×
                                                    </RemoveTimeButton>
                                                </TimeSlot>
                                            ))
                                        )}
                                    </TimeSlotsList>
                                </AvailabilitySection>
                            )}
                        </Section>
                    )}
                </ChatContent>

                <ButtonRow>
                    {currentStep > 1 ? (
                        <Button onClick={() => setCurrentStep(currentStep - 1)}>
                            <ChevronLeft size={16} />
                            Back
                        </Button>
                    ) : (
                        <Button onClick={() => onClose()}>
                            Cancel
                        </Button>
                    )}

                    <Button
                        $primary
                        onClick={handleNext}
                        disabled={!isStepValid() || submitting}
                    >
                        {currentStep === finalStep ? (
                            submitting ? 'Submitting...' : <><Send size={16} />Submit Preferences</>
                        ) : (
                            <><ChevronRight size={16} />Next</>
                        )}
                    </Button>
                </ButtonRow>
            </ModalContainer>
        </Overlay>
    );
}