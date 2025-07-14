import React from 'react';
import { useNavigate } from 'react-router-dom';
import TripDashboard from './TripDashboard.js';

function TripDashboardPage() {
    const navigate = useNavigate();

    return (
        <TripDashboard
            setShowActivities={() => navigate('/')}
            setSelectedActivityId={(id) => navigate(`/activity/${id}`)}
        />
    );
}

export default TripDashboardPage;