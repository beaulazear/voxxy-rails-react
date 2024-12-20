import React, { useState } from "react";
import styled from 'styled-components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 20px 0; /* Ensures padding doesn’t interfere with global styles */
  background: #f9f9f9; /* Soft background color */
  color: inherit; /* Matches the text color of the parent */
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #4a90e2; /* Accent color */
  text-align: center; /* Ensures alignment consistency */
`;

const GenerateButton = styled.button`
  background-color: #4a90e2; /* Accent color */
  color: #fff;
  font-size: 1rem;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #357abd; /* Darker accent color */
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background-color: #b3c7e6;
    cursor: not-allowed;
  }
`;

const HaikuResult = styled.p`
  font-size: 1.25rem;
  margin-top: 20px;
  max-width: 500px;
  text-align: center;
  padding: 15px;
  border-radius: 10px;
  line-height: 1.5;
  color: inherit; /* Matches parent text color */
`;

export default function WaitlistPage() {
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

    const fetchHaiku = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/openai/haiku`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: "write a haiku about AI" }),
            });
            const data = await response.json();
            setResult(data.haiku);
        } catch (error) {
            console.error("Error fetching haiku:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <Title>OpenAI Haiku Generator</Title>
            <GenerateButton onClick={fetchHaiku} disabled={loading}>
                {loading ? "Generating..." : "Generate Haiku"}
            </GenerateButton>
            {result && <HaikuResult>{result}</HaikuResult>}
        </PageContainer>
    );
}