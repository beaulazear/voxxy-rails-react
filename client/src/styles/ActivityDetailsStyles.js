import styled from "styled-components";

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
  background-color: #f9f9f9;
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
    text-align: center;
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

  .trash-icon {
    cursor: pointer;
    font-size: 1.4rem;
    transition: opacity 0.3s ease;
    position: relative;
    padding-bottom: 10px;

    &:hover {
      opacity: 0.7;
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
  margin-top: 2rem;
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
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

export const SmallSection = styled.div`
  flex: 1;
  min-width: 280px;
  background: #fff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    text-align: left;
    font-weight: 600;
  }
`;

export const InviteButton = styled.button`
  padding: 0.5rem 1rem;
  background: #9b59b6;
  color: #fff;
  border-radius: 20px;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  
  &:hover {
    background: #8e44ad;
  }
`;

export const ParticipantsSection = styled.div`
  margin-top: 1rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  background: #fff;

  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
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
    background: #9b59b6;
    color: #fff;
  }

  .pending {
    background: #f0f0f0;
    color: #666;
    border: 1px solid #ccc;
  }
`;