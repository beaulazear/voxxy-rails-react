// src/components/WaitlistPage.js
import React from "react";
import WaitlistForm from "./WaitlistForm";
import UserForm from "./UserForm";
import HeroText from './HeroText';
import styled from 'styled-components';

const PageContainer = styled.div`
  width: 100%;
  overflow-x: hidden; /* Prevents horizontal overflow */
  padding: 0;
  margin: 0 auto;
`;

export default function WaitlistPage() {
    return (
        <PageContainer>
            <HeroText />
            <WaitlistForm />
            <UserForm />
        </PageContainer>
    );
}