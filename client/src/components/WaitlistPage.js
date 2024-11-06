import React from "react";
import WaitlistForm from "./WaitlistForm";
import UserForm from "./UserForm";
import HeroText from './HeroText';

export default function WaitlistPage() {
    return (
        <div>
            <HeroText />
            <WaitlistForm />
            <UserForm />
        </div>
    )
}