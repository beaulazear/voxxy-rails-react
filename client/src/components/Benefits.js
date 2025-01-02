import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const BenefitsContainer = styled.section`
  display: grid;
  grid-template-columns: 1fr 2fr; 
  gap: 30px;
  padding: 50px 20px;
  background-color: #f9fafc;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr; /* Single column on tablets */
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 30px 10px;
    gap: 20px;
  }
`;

// 📝 Static Text Column
const BenefitsText = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);

  h1 {
    font-size: 2rem;
    margin-bottom: 10px;
    color: #333;

    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1rem;
    color: #666;
    line-height: 1.5;
  }
`;

// 📚 Dropdown Section
const BenefitsDropdown = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  text-align: left;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

// 🔽 Dropdown Item
const DropdownItem = styled.div`
  border-bottom: 1px solid #e0e0e0;
  padding: 15px 0;

  &:last-child {
    border-bottom: none;
  }
`;

// 🔼 Dropdown Header
const DropdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #6c63ff;
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;

    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  span {
    font-size: 1.5rem;
    color: #6c63ff;
  }
`;

// 📄 Dropdown Content
const DropdownContent = styled.div`
  margin-top: 10px;
  padding-left: 15px;
  font-size: 1rem;
  color: #555;
  line-height: 1.5;

  ul {
    margin-left: 20px;
    list-style-type: disc;

    li {
      margin-top: 5px;
    }
  }
`;

// 🚀 Button
const Button = styled.button`
  margin-top: 15px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: linear-gradient(to right, #6c63ff, #e942f5);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

// 🏠 **Benefits Component**
function Benefits( ) {
    const [activeIndex, setActiveIndex] = useState(null);

    const navigate = useNavigate()

    const toggleDropdown = (index) => {
      setActiveIndex(activeIndex === index ? null : index);
    };

    const handleNavigate = () => {
      navigate("/signup")
    }
    
    return (
        <BenefitsContainer>
            {/* 📝 Static Text Column */}
            <BenefitsText>
                <h1>Voxxy is your ultimate companion for planning adventures.</h1>
                <p>
                    Whether you're exploring cities, relaxing on beaches, or hiking mountains, Voxxy simplifies the decision-making process and makes travel effortless.
                </p>
            </BenefitsText>

            {/* 📚 Dropdown Column */}
            <BenefitsDropdown>
                {/* 🔽 Dropdown Item 1 */}
                <DropdownItem>
                    <DropdownHeader onClick={() => toggleDropdown(1)}>
                        <h3>Group-Friendly Collaboration</h3>
                        <span>{activeIndex === 1 ? '▲' : '▼'}</span>
                    </DropdownHeader>
                    {activeIndex === 1 && (
                        <DropdownContent>
                            <p>
                                Voxxy helps your group make decisions without the chaos. Whether you’re taking the quiz solo or sending surveys to friends, Voxxy ensures everyone has a voice – without the noise.
                            </p>
                            <ul>
                                <li>Collaborative decision-making made easy.</li>
                                <li>Group polls and real-time voting.</li>
                                <li>Seamless sharing and updates with everyone.</li>
                            </ul>
                            <Button onClick={handleNavigate()}>Start Planning</Button>
                        </DropdownContent>
                    )}
                </DropdownItem>

                {/* 🔽 Dropdown Item 2 */}
                <DropdownItem>
                    <DropdownHeader onClick={() => toggleDropdown(2)}>
                        <h3>Smart AI Planning</h3>
                        <span>{activeIndex === 2 ? '▲' : '▼'}</span>
                    </DropdownHeader>
                    {activeIndex === 2 && (
                        <DropdownContent>
                            <p>
                                Easily organize your trip itinerary, book accommodations, and plan activities—all in one place.
                            </p>
                        </DropdownContent>
                    )}
                </DropdownItem>

                {/* 🔽 Dropdown Item 3 */}
                <DropdownItem>
                    <DropdownHeader onClick={() => toggleDropdown(3)}>
                        <h3>Personalized Recommendations</h3>
                        <span>{activeIndex === 3 ? '▲' : '▼'}</span>
                    </DropdownHeader>
                    {activeIndex === 3 && (
                        <DropdownContent>
                            <p>
                                Enjoy a smooth and intuitive app experience designed for ease of use on every device.
                            </p>
                        </DropdownContent>
                    )}
                </DropdownItem>
            </BenefitsDropdown>
        </BenefitsContainer>
    );
}

export default Benefits;