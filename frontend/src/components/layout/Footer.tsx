import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t bg-background py-4">
      <div className="container mx-auto px-4 text-sm text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} InterviewShare. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
