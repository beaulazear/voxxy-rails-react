import React, { useEffect } from "react";
import WaitlistForm from "./WaitlistForm";
import Footer from "./Footer";
import styled from "styled-components";
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography'; // ✅ optional if you want to use Heading components

const SectionContainer = styled.section`
  background-color: ${colors.backgroundTwo};
  padding: 4rem 1rem;
  text-align: center;
  color: ${colors.textPrimary};
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;

const Subtitle = styled(MutedText)`
  font-size: 1rem;
  max-width: 600px;
  margin: 0.5rem auto 3rem auto;
  line-height: 1.6;
`;

export default function Blogs() {

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <div style={{ paddingTop: '100px', backgroundColor: '#251C2C' }}>
            <SectionContainer>
                <SectionInner>
                    <Title>Blogs Coming Soon</Title>
                    <Subtitle>We're working hard to bring you valuable content about group planning, travel tips, and making memories together. Stay tuned!</Subtitle>
                </SectionInner>
            </SectionContainer>
            <WaitlistForm />
            <Footer />
        </div>
    )
}