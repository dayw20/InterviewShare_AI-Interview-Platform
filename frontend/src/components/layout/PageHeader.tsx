import React from 'react';
import { PageHeaderProps } from '@/types/layout';

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
};

export default PageHeader;
