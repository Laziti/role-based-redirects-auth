
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from '@/components/ui/avatar';

interface AgentProfileHeaderProps {
  firstName: string;
  lastName: string;
  career?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

const AgentProfileHeader: React.FC<AgentProfileHeaderProps> = ({
  firstName,
  lastName,
  career,
  avatarUrl,
  phoneNumber
}) => {
  return (
    <Card className="bg-[var(--portal-card-bg)] border-[var(--portal-border)] shadow-md">
      <CardContent className="flex flex-col sm:flex-row items-center p-6 gap-4">
        <Avatar className="w-24 h-24 border-2 border-gold-500">
          <div className="bg-gold-900 text-white w-full h-full flex items-center justify-center text-3xl font-bold">
            {firstName?.charAt(0) || ''}{lastName?.charAt(0) || ''}
          </div>
        </Avatar>
        
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gold-500 mb-1">
            {firstName} {lastName}
          </h1>
          {career && (
            <p className="text-[var(--portal-text-secondary)] mb-2">
              {career}
            </p>
          )}
          {phoneNumber && (
            <a 
              href={`tel:${phoneNumber}`} 
              className="inline-flex items-center text-sm text-gold-500 hover:underline"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              {phoneNumber}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentProfileHeader;
