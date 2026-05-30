import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EditorialHeadingProps {
  eyebrow?: string;
  children: ReactNode;
  align?: 'left' | 'center';
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  md: 'text-3xl md:text-5xl',
  lg: 'text-4xl md:text-6xl',
  xl: 'text-5xl md:text-7xl lg:text-8xl',
};

export const EditorialHeading = ({
  eyebrow,
  children,
  align = 'left',
  size = 'lg',
  className,
}: EditorialHeadingProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-xs md:text-sm uppercase tracking-[0.25em] text-gold-light/80">
          <span className="h-px w-8 bg-gold-light/50" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'font-editorial text-foreground',
          sizeMap[size]
        )}
      >
        {children}
      </h2>
    </div>
  );
};
