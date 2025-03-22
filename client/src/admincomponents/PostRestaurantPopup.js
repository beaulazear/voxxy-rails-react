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
                    <ButtonPrimary onClick={onChat}>Chat with Voxxy</ButtonPrimary>
                    <ButtonSecondary onClick={onSkip}>Skip to board</ButtonSecondary>
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
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  text-align: center;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const ButtonPrimary = styled.button`
  background: #6c63ff;
  color: #fff;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;

const ButtonSecondary = styled.button`
  background: #eee;
  color: #333;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;