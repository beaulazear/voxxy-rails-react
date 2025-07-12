import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';
import LoadingScreen from '../components/LoadingScreen';
import ActivityDetailsPage from '../admincomponents/ActivityDetailsPage';

const ProtectedActivityRoute = () => {
    const { user, loading: userLoading } = useContext(UserContext);
    const { activityId } = useParams();
    const navigate = useNavigate();
    const [accessStatus, setAccessStatus] = useState('checking'); // 'checking', 'allowed', 'denied'
    const [isValidating, setIsValidating] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const numericActivityId = parseInt(activityId, 10);

    useEffect(() => {
        // Handle redirect when access is denied
        if (accessStatus === 'denied') {
            console.log('🏠 Redirecting to home due to access denial');
            navigate('/', {
                replace: true,
                state: {
                    message: 'You don\'t have access to this activity or it doesn\'t exist.'
                }
            });
        }
    }, [accessStatus, navigate]);

    useEffect(() => {
        // Wait for user to load first
        if (userLoading) return;

        // If no user is logged in, redirect to home
        if (!user || !user.email) {
            navigate('/', { replace: true });
            return;
        }

        // If invalid activity ID, redirect to home
        if (!activityId || isNaN(numericActivityId)) {
            navigate('/', { replace: true });
            return;
        }

        // Define validateAccess inside useEffect to avoid dependency issues
        const validateAccess = async () => {
            try {
                setIsValidating(true);

                // First check if user has activity in their context (most common case)
                const hasActivityInContext =
                    user.activities?.some(activity => activity.id === numericActivityId) ||
                    user.participant_activities?.some(p =>
                        (p.activity?.id || p.activity_id) === numericActivityId
                    );

                if (hasActivityInContext) {
                    console.log('✅ User has activity in context - allowing access');
                    setAccessStatus('allowed');
                    setIsValidating(false);
                    return;
                }

                console.log('🔍 Activity not in user context, checking via API...');

                // If not in context, make API call to verify access
                const response = await fetch(`${API_URL}/activities/${numericActivityId}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const activityData = await response.json();
                    console.log('📊 Activity data received:', activityData);

                    // Validate that we actually received activity data, not user data
                    if (!activityData.activity_name && !activityData.name) {
                        console.log('❌ Invalid response - not activity data');
                        setAccessStatus('denied');
                        return;
                    }

                    // Check if user is owner or participant (be more permissive)
                    const isOwner = activityData.user_id === user.id || activityData.user?.id === user.id;
                    const isParticipant = activityData.participants?.some(p =>
                        p.id === user.id || p.email?.toLowerCase() === user.email?.toLowerCase()
                    );
                    const hasInvitation = activityData.activity_participants?.some(ap =>
                        ap.invited_email?.toLowerCase() === user.email?.toLowerCase() ||
                        ap.user_id === user.id
                    );

                    if (isOwner || isParticipant || hasInvitation) {
                        console.log('✅ User has valid access - allowing');
                        setAccessStatus('allowed');
                    } else {
                        console.log('❌ User does not have access to this activity');
                        setAccessStatus('denied');
                    }
                } else if (response.status === 404) {
                    console.log('❌ Activity not found (404)');
                    setAccessStatus('denied');
                } else if (response.status === 403) {
                    console.log('❌ Access forbidden (403)');
                    setAccessStatus('denied');
                } else {
                    // For other HTTP errors, log but don't block - could be temporary server issues
                    console.warn(`⚠️ Unexpected response status: ${response.status}. Allowing access to prevent false blocks.`);
                    setAccessStatus('allowed');
                }
            } catch (error) {
                console.error('⚠️ Error validating activity access:', error);
                // On network/parsing errors, allow access to prevent false blocks
                // The ActivityDetailsPage itself will handle the actual data fetching
                console.log('🔓 Network error - allowing access, let ActivityDetailsPage handle it');
                setAccessStatus('allowed');
            } finally {
                setIsValidating(false);
            }
        };

        validateAccess();
    }, [user, userLoading, activityId, numericActivityId, navigate, API_URL]);

    // Show loading while validating OR while redirecting
    if (userLoading || isValidating || accessStatus === 'checking' || accessStatus === 'denied') {
        return <LoadingScreen />;
    }

    // Only render ActivityDetailsPage if access is explicitly allowed
    if (accessStatus === 'allowed') {
        console.log('🎯 Rendering ActivityDetailsPage');
        return <ActivityDetailsPage />;
    }

    // Fallback - should never reach here, but return loading if we do
    return <LoadingScreen />;
};

export default ProtectedActivityRoute;