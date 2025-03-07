import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
  background-color: #f9f9f9;
  animation: ${fadeIn} 0.8s ease-in-out;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  text-align: left;
  position: relative;
  width: 100%;

  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0 auto;
    flex-grow: 1;
    text-align: left;
  }

  .back-button {
    padding: 0.5rem 1rem;
    background: #e942f5;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;

    &:hover {
      background: #d932e0;
    }
  }

  .icon-buttons {
    display: flex;
    align-items: center;
  }
}
`;

export const Section = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;

  h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    text-align: left;
    font-weight: 600;
  }
`;

export const TabsSection = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  .tabs {
    display: flex;
    width: 100%;
    max-width: 400px;
    justify-content: space-between;
    border-radius: 8px;
    overflow: hidden;

    button {
      flex: 1;
      padding: 0.75rem 0;
      text-align: center;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      background: #f0f0f0;
      color: #555;
      transition: all 0.3s ease;

      &.active {
        background: #fff;
        color: #000;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }
`;

export const ChatButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

export const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s ease;
  background: ${(props) => (props.$isDelete ? "#e74c3c" : "#9b59b6")};

  &:hover {
    background: ${(props) => (props.$isDelete ? "#c0392b" : "#8e44ad")};
  }
`;

export const DimmedOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
`;

export const FlexContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

export const SmallSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-height: 100%;
  max-height: 1000px; /* ✅ Set a max height */
  justify-content: space-between;
  text-align: left;
  max-width: 800px;

  @media (min-width: 768px) {
    min-width: 420px;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-align: left;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-item {
    font-size: 1rem;
    padding: 0.5rem;
    background: #f7f7f7;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  button {
    align-self: flex-start;
    padding: 0.5rem 1rem;
    margin-top: 1rem;
  }

.update-section {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.update-icon {
  cursor: pointer;
  font-size: 1.8rem;
  color: #6a1b9a;
  padding: 0.4rem 0.2rem;
  display: flex;
  align-items: flex-end;
  position: relative;
  line-height: 1;
  transition: color 0.3s ease, transform 0.2s ease;

  &:hover {
    color: #6a1b9a;
    transform: scale(1.1);
  }

  &:before {
    content: "Update Board";
    position: absolute;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 0.75rem;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(5px);
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    pointer-events: none;
  }

  &:hover:before {
    opacity: 1;
  }
}

.trash-icon {
  cursor: pointer;
  font-size: 1.8rem;
  color: #e74c3c;
  padding: 0.4rem 0.2rem;
  display: flex;
  align-items: flex-end;
  position: relative;
  line-height: 1;
  transition: color 0.3s ease, transform 0.2s ease;

  &:hover {
    color: #c0392b;
    transform: scale(1.1);
  }

  &:before {
    content: "Delete Board";
    position: absolute;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 0.75rem;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(5px);
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    pointer-events: none;
  }

  &:hover:before {
    opacity: 1;
  }
}

  @media (max-width: 768px) {
    padding: 1.25rem;

    button {
      margin-top: 1.5rem;
    }
  }
`;

export const ParticipantsSection = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  padding: 1.25rem;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;

  h3 {
    font-size: 1.2rem;
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  h3:nth-of-type(2) {
    margin-top: 1rem;
  }

  /* Horizontal Scroll for Confirmed Participants */
  .participants-scroll {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 10px;
    scrollbar-width: none; /* Hide scrollbar for Firefox */
    -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
  }

  .participants-scroll::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome/Safari */
  }

  /* Circular Avatar for Confirmed Participants */
  .participant-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: #6a1b9a;
    color: white;
    font-size: 1rem;
    font-weight: bold;
    text-transform: uppercase;
    flex-shrink: 0;
    cursor: pointer;
    transition: width 0.3s ease-in-out;
    overflow: hidden;
    position: relative;
    white-space: nowrap;
    padding: 0 10px;
  }

  /* Expanding Effect: Only Expands Horizontally */
  .participant-circle:hover {
    width: auto;
    min-width: 120px; /* Ensures space for full name */
    border-radius: 20px; /* Keeps rounded edges */
    padding: 0 15px;
  }

  /* Hide Full Name by Default */
  .full-name {
    display: none;
    margin-left: 5px;
  }

  /* Show Full Name on Hover */
  .participant-circle:hover .initials {
    display: none;
  }

  .participant-circle:hover .full-name {
    display: inline;
  }

  /* Pending Participants List */
  .participants-list {
    flex-grow: 1;
    overflow-y: auto;
    max-height: 250px;
    padding-right: 0.5rem;
  }

  .participant {
    display: inline-block;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border-radius: 20px;
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
  }

  .confirmed {
    background: #6a1b9a;
    color: #fff;
  }

  .pending {
    background: #d3d3d3;
    color: #444;
  }

  .invite-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    padding: 1rem;

    .invite-section {
      flex-direction: column;
      align-items: stretch;
    }

    input {
      width: 100%;
    }
  }
`;

export const InviteButton = styled.button`
  padding: 0.5rem 1rem;
  background: #9b59b6;
  color: #fff;
  border-radius: 8px;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  white-space: nowrap;

  margin-left: 10px;

  @media (max-width: 768px) {
    margin-top: 0.5rem;
  }

  &:hover {
    background: #8e44ad;
  }
`;