import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Briefcase, Award, Star, Calendar } from 'lucide-react';

interface AgentProfileHeaderProps {
  firstName: string;
  lastName: string;
  career?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  description?: string;
  experience?: string;
  email?: string;
  location?: string;
}

const AgentProfileHeader = ({
  firstName,
  lastName,
  career,
  phoneNumber,
  avatarUrl,
  description,
  experience,
  email,
  location
}: AgentProfileHeaderProps) => {
  // Default description if none provided
  const agentDescription = description || `${firstName} ${lastName} is a trusted real estate agent specializing in finding the perfect properties for clients.`;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-[var(--portal-border)] bg-gradient-to-b from-[var(--portal-card-bg)] to-[var(--portal-bg)] p-6 shadow-md"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-500/5 rounded-full -ml-20 -mb-20 blur-2xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gold-500/20 shadow-xl bg-[var(--portal-bg-hover)]">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={`${firstName} ${lastName}`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-400 to-gold-600 text-black text-2xl font-bold">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gold-500 text-black rounded-full p-2 shadow-lg">
            <Star className="h-5 w-5" />
          </div>
        </motion.div>
        
        {/* Info Section */}
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gold-500 mb-1">{firstName} {lastName}</h1>
            
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[var(--portal-text-secondary)]">
          {career && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--portal-bg-hover)] rounded-full text-sm">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{career}</span>
                </div>
              )}
              
              {experience && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--portal-bg-hover)] rounded-full text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{experience}</span>
                </div>
              )}
              
              {location && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--portal-bg-hover)] rounded-full text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{location}</span>
                </div>
              )}
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-[var(--portal-text)] mb-4 max-w-2xl leading-relaxed"
            >
              {agentDescription}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex flex-wrap gap-4 mt-4"
            >
          {phoneNumber && (
            <a 
              href={`tel:${phoneNumber}`} 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-lg hover:bg-gold-600 transition-colors font-medium shadow-sm"
                >
                  <Phone className="h-4 w-4" />
              {phoneNumber}
            </a>
          )}
              
              {email && (
                <a 
                  href={`mailto:${email}`} 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--portal-bg-hover)] text-[var(--portal-text)] rounded-lg hover:bg-[var(--portal-border)] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {email}
                </a>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentProfileHeader;
