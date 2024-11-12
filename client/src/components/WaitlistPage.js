import React from "react";
import styled from 'styled-components';
import WaitlistForm from "./WaitlistForm";

const PageContainer = styled.div`
  width: 100%;
  overflow-x: hidden; /* Prevents horizontal overflow */
  padding: 0;
  margin: 0 auto;
`;

export default function WaitlistPage() {
    return (
        <PageContainer>
            <WaitlistForm />
        </PageContainer>
    );
}