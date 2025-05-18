// PostRestaurantPopup.js
import React from 'react';
import styled from 'styled-components';

function PostRestaurantPopup({ onChat, onSkip }) {
    return (
        <PopupOverlay>
            <PopupContainer>
                <h2>Voxxy board created!</h2>
                <p>
                    Would you like to chat with Voxxy for more personalized recommendations, or skip straight to the board?
                </p>
                <ButtonRow>
                    <Button $primary onClick={onChat}>Chat with Voxxy</Button>
                    <Button onClick={onSkip}>Skip to board</Button>
                </ButtonRow>
            </PopupContainer>
        </PopupOverlay>
    );
}

export default PostRestaurantPopup;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const PopupContainer = styled.div`
  background: #2C1E33;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  color: #ddd;
  text-align: center;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  background: ${({ $primary }) => ($primary ? '#cc31e8' : 'transparent')};
  color: ${({ $primary }) => ($primary ? 'white' : '#6c63ff')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid #6c63ff')};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
`;